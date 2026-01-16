"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import ReactHtmlParser from "react-html-parser";
import styled from "styled-components";
import { Button, Icon } from "semantic-ui-react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { useMutation } from "@apollo/client";
import { CREATE_AI_THREAD, UPDATE_AI_THREAD } from "../Mutations/AiThread";
import { useUser } from "../Utils/Access/User";

const AiUiPanelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 900px;
  min-height: 100px;
  max-height: 200px;
  position: relative;
  z-index: 1;
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
  margin: 0;

  overflow: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease, max-height 0.2s ease, margin 0.2s ease;
  border-radius: 16px;
  background: #f0f5f5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1.5px solid #55808C;

  &.visible {
    opacity: 1;
    transform: translateY(0);
    max-height: 1000px;
    margin: 16px 0;
  }

  .aiUiContent {
    padding: 16px 20px;
    color: #434343;
    font-size: 14px;
    line-height: 1.6;
    
    p {
      margin: 0.5rem 0;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-weight: bold;
      margin: 1rem 0 0.5rem;
      color: #274E5B;
    }
    
    ul, ol {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
    }
    
    li {
      margin-bottom: 0.25rem;
    }
    
    a {
      color: #3D85B0;
      text-decoration: underline;
      
      &:hover {
        color: #7D70AD;
      }
    }
  }

  .statusBanner {
    padding: 12px 20px;
    background: #D3E0E3;
    border-bottom: 1px solid #55808C;
    color: #274E5B;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    
    .statusIcon {
      width: 16px;
      height: 16px;
      border: 2px solid #55808C;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  }

  .actionBanner {
    padding: 8px 20px;
    border-top: 1px solid #55808C;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
    
    .actionBannerLeft {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .actionBannerRight {
      display: flex;
      align-items: center;
      margin-left: auto;
    }
    
    button {
      border: 1.5px solid var(--special-button-border, #274E5B);
      background: var(--special-button-background, #FFFFFF);
      color: var(--special-button-text, #274E5B);
      border-radius: 100px;
      padding: 8px 16px 8px 20px;
      font-family: 'Lato', sans-serif;
      font-size: 16px;
      font-weight: 400;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: none;
      
      &:hover:not(:disabled) {
        background: var(--special-button-hover-background, #274E5B);
        color: var(--special-button-hover-text, #FFFFFF);
        border-color: var(--special-button-hover-border, #274E5B);
        box-shadow: 0 6px 16px rgba(39, 78, 91, 0.2);
      }
      
      &:active:not(:disabled) {
        transform: translateY(1px);
        box-shadow: 0 2px 8px rgba(39, 78, 91, 0.2);
      }
      
      &:disabled {
        opacity: 0.6;
        border-color: #D3E0E3;
        color: #7A7A7A;
        cursor: not-allowed;
        box-shadow: none;
      }
      
      &.loading {
        opacity: 0.8;
      }
      
      &.small {
        font-size: 14px;
        padding: 6px 12px;
      }
      
      &.closeButton {
        padding: 8px;
        border-color: #274E5B;
        color: #274E5B;
        background: #F3F3F3;
        min-width: auto;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
      }
    }
  }

  .resultContent {
    margin-top: 16px;
    
    .resultButtons {
      margin-top: 12px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      
      button {
        background: #FFFFFF;
        color: #69BBC4;
        border: 1px solid #69BBC4;
        border-radius: 100px;
        padding: 8px 16px;
        font-family: 'Lato', sans-serif;
        font-size: 14px;
        font-weight: 400;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          background: #E6E6E6;
          opacity: 0.8;
        }
        
        &:active {
          background: #F3F3F3;
        }
      }
    }
  }
`;

/**
 * Helper function to determine if AI UI content should be displayed
 * @param {Function|string|ReactElement|null} aiUiContent - The AI UI content prop
 * @returns {ReactElement|string|null} - The processed content to display
 */
const getAiUiContent = (aiUiContent) => {
  if (!aiUiContent) return null;
  
  // If it's a function, call it to get the content
  if (typeof aiUiContent === 'function') {
    return aiUiContent();
  }
  
  // Otherwise, return it directly
  return aiUiContent;
};

/**
 * Maps question name to agent question number
 * Based on template: name "2" -> Q1, "1" -> Q2, "3" -> Q3, "5" -> Q4
 */
const mapQuestionNameToNumber = (name) => {
  const mapping = {
    "2": "Q1",
    "1": "Q2", 
    "3": "Q3",
    "5": "Q4"
  };
  return mapping[name] || null;
};

/**
 * AiUiPanel Component
 * Displays AI-generated content in a styled panel between the toolbar and editor
 * 
 * @param {Object} props
 * @param {Function|string|ReactElement|null} props.aiUiContent - The content to display (can be a function, string, or React element)
 * @param {boolean} props.isFocused - Whether the editor is currently focused
 * @param {string} props.proposalId - The proposal ID for the agent
 * @param {string} props.questionNumber - The question name (e.g., "1", "2", "3", "5")
 * @param {string} props.currentTextContent - Current text content in the editor
 */
export default function AiUiPanel({ 
  aiUiContent, 
  isFocused,
  proposalId,
  questionNumber,
  currentTextContent
}) {
  const [ongoingStep, setOngoingStep] = useState(null);
  const [result, setResult] = useState(null);
  const [savedThreadId, setSavedThreadId] = useState(null); // LangGraph's generated thread ID
  const [isManuallyClosed, setIsManuallyClosed] = useState(false);
  
  // Track state to prevent infinite loops
  const lastStatusRef = useRef(null);
  const hasProcessedCompletionRef = useRef(false);
  const lastOngoingStepRef = useRef(null);

  const user = useUser();
  const [createAiThread] = useMutation(CREATE_AI_THREAD);
  const [updateAiThread] = useMutation(UPDATE_AI_THREAD);

  const mappedQuestionNumber = questionNumber ? mapQuestionNameToNumber(questionNumber) : null;

  // Display message shown in the UI at zero-state (before clicking the button)
  // This can be customized and mentions the questionNumber
  const displayMessage = useMemo(() => {
    if (!mappedQuestionNumber || !proposalId) return null;
    // Customize this message as needed - it's what the user sees before clicking
    return `Require help to provide feedback for ${mappedQuestionNumber} of this student's proposal`;
  }, [mappedQuestionNumber, proposalId]);

  // Message that will be submitted to the agent (separate from display)
  const initialMessage = useMemo(() => {
    if (!mappedQuestionNumber || !proposalId) return null;
    return `I need help with question ${mappedQuestionNumber} for proposal ${proposalId}.`;
  }, [mappedQuestionNumber, proposalId]);

  // Initialize result with the display message when showAgentUI is available
  const showAgentUI = proposalId && questionNumber;
  useEffect(() => {
    // Set display message when agent UI becomes available
    // Only set if we haven't started processing (no ongoingStep) and result is null
    if (showAgentUI && displayMessage && !ongoingStep && !result) {
      setResult({
        textDisplay: displayMessage,
        buttonsArray: [],
      });
    }
  }, [showAgentUI, displayMessage]);

  // Get the endpoint from environment variables
  const uriEndpoint = process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_LANGGRAPH_ENDPOINT_DEV
    : process.env.NEXT_PUBLIC_LANGGRAPH_ENDPOINT;

  // Set up the streaming thread - only when endpoint is available
  // IMPORTANT: Let LangGraph create the thread automatically and use its thread ID consistently
  const thread = useStream(
    uriEndpoint
      ? {
          apiUrl: uriEndpoint,
          assistantId: "feedback_agent",
          messagesKey: "messages",
          // Don't pass threadId here - let LangGraph create the thread
          // Passing it would require the thread to already exist (causes 404 if it doesn't)
          threadId: savedThreadId || undefined, // Only use saved ID for resuming existing threads
          onThreadId: (id) => {
            // LangGraph generated/created a thread ID - use this consistently
            if (!savedThreadId && id) {
              setSavedThreadId(id);
              // Save to database
              if (user?.id) {
                createAiThread({
                  variables: {
                    threadId: id,
                    assistantId: "feedback_agent",
                    proposalId,
                    status: "streaming",
                  },
                }).catch((error) => {
                  console.error("Error saving thread:", error);
                });
              }
            }
          },
          onUpdateEvent: (ev) => {
            // Handle update events - check for completion indicators
            console.log("Update event:", ev);
            
            // Check if result exists in the update event (from tool_node or agent)
            // The update events have structure: {tool_node: {...}} or {agent: {...}}
            const eventState = ev?.tool_node || ev?.agent;
            if (eventState?.result && eventState.result.textDisplay && !hasProcessedCompletionRef.current) {
              console.log("✅ Completion detected in update event:", eventState.result);
              hasProcessedCompletionRef.current = true;
              setResult(eventState.result);
              setOngoingStep("Complete");
              
              // Final update to database with complete status
              // Note: State persistence is now handled automatically by PostgreSQL checkpointer
              // No need to manually save threadState - checkpointer maintains full conversation history
              if (user?.id && savedThreadId) {
                updateAiThread({
                  variables: {
                    threadId: savedThreadId,
                    status: "complete",
                  },
                }).catch((error) => {
                  console.error("Error updating thread status:", error);
                });
              }
            }
            
            // Check if event indicates completion
            if (ev?.event === "on_chain_end" || ev?.event === "end") {
              console.log("Completion event detected:", ev);
            }
          },
          config: {
            configurable: {
              // Use LangGraph's thread_id consistently for checkpointer
              // Will be undefined on first request, then set after onThreadId callback
              thread_id: savedThreadId || undefined,
            },
          },
        }
      : null
  );

  // Handle starting the feedback generation
  const handleGenerateFeedback = () => {
    if (!proposalId || !questionNumber || !mappedQuestionNumber) {
      console.error("Missing proposalId or questionNumber");
      return;
    }

    if (!uriEndpoint) {
      console.error("LangGraph endpoint not configured");
      setOngoingStep("Error: LangGraph endpoint not configured");
      return;
    }

    if (thread?.isLoading) {
      console.warn("Tried to submit while thread is busy");
      return;
    }

    setOngoingStep("Starting feedback generation...");
    hasProcessedCompletionRef.current = false;
    lastStatusRef.current = null;
    lastOngoingStepRef.current = null;

    // Use the pre-calculated initialMessage (already displayed in UI)
    if (!initialMessage) {
      console.error("Initial message not available");
      return;
    }

    // Prepare the input in the format the graph expects
    // IMPORTANT: result must be null here to ensure the agent's routing logic
    // (shouldContinue) doesn't think the task is already complete. The routing
    // checks `if (state.result && state.result.textDisplay)` and returns END
    // if true, so we explicitly set result: null to start fresh.
    const input = {
      messages: [
        {
          role: "human",
          content: initialMessage,
        },
      ],
      proposalId,
      questionNumber: mappedQuestionNumber,
      currentTextContent: currentTextContent || null,
      proposalCards: null,
      publicTaskDocs: null,
      result: null, // Explicitly null to ensure agent starts fresh
      ongoingStep: "Starting feedback generation...",
    };

    console.log("Submitting input:", input);
    
    // Submit to start the stream
    // Note: onThreadId callback will handle saving to database when thread ID is generated
    thread.submit(input);
  };

  // Monitor stream events and update state
  useEffect(() => {
    if (!thread) {
      return;
    }
    
    // Wait for thread ID to be set (via onThreadId callback)
    if (!savedThreadId) {
      return;
    }

    // Try different ways to access thread state
    const threadState = thread.state || thread.currentState || thread.values;
    const threadStateValues = threadState?.values || threadState;
    const threadStatus = thread.status || thread.currentStatus;
    const threadNext = threadState?.next || thread.next;
    
    // PRIMARY COMPLETION CHECK: Check if result exists in state OR if next is empty (graph ended)
    // This is the most reliable indicator - the agent sets result before reaching END
    // The toolNode sets state.result when a feedback tool completes, then shouldContinue returns END
    // If next is empty array, the graph has ended (even if result wasn't set yet)
    const hasResult = threadStateValues?.result && threadStateValues.result.textDisplay;
    const graphEnded = Array.isArray(threadNext) && threadNext.length === 0;
    
    if ((hasResult || graphEnded) && !hasProcessedCompletionRef.current) {
      if (hasResult) {
        console.log("✅ Completion detected via state.result:", threadStateValues.result);
        setResult(threadStateValues.result);
      } else if (graphEnded) {
        console.log("✅ Completion detected via empty next array (graph ended)");
        // Graph ended but no result - try to extract from messages
        let extractedResult = null;
        if (threadStateValues?.messages) {
          const feedbackMessages = threadStateValues.messages.filter((m) => 
            m.content && typeof m.content === 'string' && m.content.includes('"textDisplay"')
          );
          if (feedbackMessages.length > 0) {
            try {
              const lastFeedback = feedbackMessages[feedbackMessages.length - 1];
              const feedbackResult = JSON.parse(lastFeedback.content);
              if (feedbackResult.textDisplay) {
                console.log("Extracted result from messages:", feedbackResult);
                extractedResult = feedbackResult;
                setResult(feedbackResult);
              }
            } catch (error) {
              console.error("Error parsing feedback result:", error);
            }
          }
        }
        // If still no result, set a default message
        if (!extractedResult) {
          setResult({
            textDisplay: "Feedback generation completed.",
            buttonsArray: [],
          });
        }
      }
      
      hasProcessedCompletionRef.current = true;
      setOngoingStep("Complete");
      
      // Final update to database with complete status
      // Note: State persistence is now handled automatically by PostgreSQL checkpointer
      if (user?.id && savedThreadId) {
        updateAiThread({
          variables: {
            threadId: savedThreadId,
            status: "complete",
          },
        }).catch((error) => {
          console.error("Error updating thread status:", error);
        });
      }
      return; // Exit early since we found completion
    }
    
    // Update ongoingStep from thread state (only if it changed)
    if (threadStateValues?.ongoingStep && threadStateValues.ongoingStep !== lastOngoingStepRef.current) {
      console.log("Updating ongoingStep from thread state:", threadStateValues.ongoingStep);
      setOngoingStep(threadStateValues.ongoingStep);
      lastOngoingStepRef.current = threadStateValues.ongoingStep;
    }

    // Only update database if status changed or we're still streaming
    const statusChanged = threadStatus !== lastStatusRef.current;
    const shouldUpdateDB = statusChanged || (threadStatus === "streaming" && threadStateValues?.ongoingStep);
    
    if (shouldUpdateDB && user?.id && savedThreadId && !hasProcessedCompletionRef.current) {
      // Update thread in database only when status changes or during streaming
      // Only update if we have a savedThreadId (thread exists)
      // Note: State persistence is now handled automatically by PostgreSQL checkpointer
      updateAiThread({
        variables: {
          threadId: savedThreadId,
          status: threadStatus || "streaming",
        },
      }).catch((error) => {
        // Handle error gracefully - thread might not exist yet or lookup failed
        // This is not critical for the UI, so we just log it
        if (error.message?.includes("may not exist") || error.message?.includes("Access denied")) {
          console.warn("Thread not found for update, skipping:", savedThreadId);
        } else {
          console.error("Error updating thread:", error);
        }
      });
      
      lastStatusRef.current = threadStatus;
    }

    // SECONDARY COMPLETION CHECK: Check status strings (fallback)
    // Only check status strings - don't rely on isLoading as it can be unreliable
    if ((threadStatus === "complete" || threadStatus === "done") && !hasProcessedCompletionRef.current) {
      console.log("Thread completion detected via status:", { threadStatus });
      hasProcessedCompletionRef.current = true;
      const state = threadStateValues;
      console.log("Final state:", state);
      
      // Double-check: if result exists, use it (should have been caught by primary check, but just in case)
      if (state?.result && state.result.textDisplay) {
        console.log("Result found in secondary check:", state.result);
        setResult(state.result);
        setOngoingStep("Complete");
        
        // Final update to database with complete status
        // Note: State persistence is now handled automatically by PostgreSQL checkpointer
        if (user?.id) {
          updateAiThread({
            variables: {
              threadId: savedThreadId,
              status: "complete",
            },
          }).catch((error) => {
            console.error("Error updating thread status:", error);
          });
        }
        return; // Exit early
      } else if (state?.messages) {
        // Extract result from messages (fallback to original logic)
        console.log("Extracting from messages, total messages:", state.messages.length);
        const feedbackMessages = state.messages.filter((m) => 
          m.content && typeof m.content === 'string' && m.content.includes('"textDisplay"')
        );
        console.log("Feedback messages found:", feedbackMessages.length);
        
        if (feedbackMessages.length > 0) {
          try {
            const lastFeedback = feedbackMessages[feedbackMessages.length - 1];
            console.log("Last feedback message:", lastFeedback);
            const feedbackResult = JSON.parse(lastFeedback.content);
            console.log("Parsed feedback result:", feedbackResult);
            setResult(feedbackResult);
            setOngoingStep("Complete");
            
            // Final update to database with complete status
            // Note: State persistence is now handled automatically by PostgreSQL checkpointer
            if (user?.id) {
              updateAiThread({
                variables: {
                  threadId: savedThreadId,
                  status: "complete",
                },
              }).catch((error) => {
                console.error("Error updating thread status:", error);
              });
            }
          } catch (error) {
            console.error("Error parsing feedback result:", error);
            setOngoingStep("Error: Unable to parse feedback");
            setResult({
              textDisplay: "An error occurred while generating feedback. Please try again.",
              buttonsArray: [],
            });
          }
        } else {
          console.log("No feedback messages found in state");
          setOngoingStep("Complete");
          setResult({
            textDisplay: "Feedback generation completed, but no result was found.",
            buttonsArray: [],
          });
        }
      } else {
        console.log("No result or messages in state");
      }
    }

    // Handle errors (only process once)
    if ((threadStatus === "error" || thread.error) && !hasProcessedCompletionRef.current) {
      console.error("Stream error:", thread.error);
      hasProcessedCompletionRef.current = true;
      setOngoingStep("Error: Unable to generate feedback");
      setResult({
        textDisplay: "An error occurred while generating feedback. Please try again.",
        buttonsArray: [],
      });
      
      // Update thread status in database
      // Note: State persistence is now handled automatically by PostgreSQL checkpointer
      if (user?.id) {
        updateAiThread({
          variables: {
            threadId: savedThreadId,
            status: "error",
          },
        }).catch((error) => {
          console.error("Error updating thread status:", error);
        });
      }
    }
  }, [thread, savedThreadId, user, createAiThread, updateAiThread]);

  const displayAiUiContent = getAiUiContent(aiUiContent);
  const showPanel = aiUiContent && isFocused;

  // Reset manual close state when panel should be shown again
  useEffect(() => {
    if (showPanel || showAgentUI) {
      setIsManuallyClosed(false);
    }
  }, [showPanel, showAgentUI]);

  if ((!showPanel && !showAgentUI) || isManuallyClosed) return null;

  return (
    <AiUiPanelWrapper className="visible">
      {ongoingStep && ongoingStep !== "Complete" && (
        <div className="statusBanner">
          <div className="statusIcon" />
          <span>{ongoingStep}</span>
        </div>
      )}
      
      <div className="aiUiContent">
        {displayAiUiContent && (typeof displayAiUiContent === 'string' ? (
          ReactHtmlParser(displayAiUiContent)
        ) : (
          displayAiUiContent
        ))}
        
        {result && (
          <div className="resultContent">
            {result.textDisplay && (
              <div>
                {typeof result.textDisplay === 'string' ? (
                  ReactHtmlParser(result.textDisplay)
                ) : (
                  result.textDisplay
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {showAgentUI && (
        <div className="actionBanner">
          <div className="actionBannerLeft">
            {/* Send button - always visible */}
            <Button
              onClick={handleGenerateFeedback}
              disabled={thread?.isLoading || (thread?.status === "streaming" || thread?.status === "pending")}
              loading={thread?.isLoading || (thread?.status === "streaming" || thread?.status === "pending")}
            >
              <Icon name="send" />
            </Button>
            
            {/* Buttons from agent's result */}
            {result?.buttonsArray && result.buttonsArray.length > 0 && (
              <>
                {result.buttonsArray.map((button, idx) => (
                  <Button
                    key={idx}
                    className="small"
                    onClick={() => {
                      // Handle button actions - to be implemented
                      console.log("Button action:", button.action);
                    }}
                  >
                    {button.text}
                  </Button>
                ))}
              </>
            )}
          </div>
          
          <div className="actionBannerRight">
            <Button
              icon
              onClick={() => setIsManuallyClosed(true)}
              className="closeButton"
            >
              <Icon name="close" />
            </Button>
          </div>
        </div>
      )}
    </AiUiPanelWrapper>
  );
}

