"use client";

import type { ReactNode } from "react";
import styled from "styled-components";
import clsx from "clsx";

export interface ToggleSwitchProps {
  /**
   * Whether the switch is on.
   * @default false
   */
  checked?: boolean;
  /**
   * Called with the next checked value when the user toggles the switch.
   */
  onChange?: (checked: boolean) => void;
  /**
   * Accessible name for the switch. Prefer this over a separate visual label
   * when the surrounding layout already shows the title.
   */
  "aria-label"?: string;
  /**
   * Optional visible label rendered beside the switch.
   */
  label?: ReactNode;
  /**
   * Disables interaction and dims the control.
   * @default false
   */
  disabled?: boolean;
  /**
   * Optional id for associating a surrounding label via `htmlFor`.
   */
  id?: string;
  /**
   * Optional className merged onto the root.
   */
  className?: string;
}

const StyledToggleSwitch = styled.button`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  width: 52px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 100px;
  box-sizing: border-box;
  cursor: pointer;
  background: var(--MH-Theme-Neutrals-Medium, #a1a1a1);
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
  }

  &.DesignSystem-ToggleSwitch--checked {
    background: var(--MH-Theme-Primary-Dark, #336f8a);

    &:hover:not(:disabled) {
      background: #265568;
    }
  }

  &.DesignSystem-ToggleSwitch--disabled {
    background: var(--MH-Theme-Neutrals-Light, #e6e6e6);
    cursor: default;
  }

  .DesignSystem-ToggleSwitch__thumb {
    display: block;
    width: 24px;
    height: 24px;
    margin-left: 4px;
    border-radius: 100px;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    box-shadow: var(--MH-Theme-Elevation-Medium, 2px 2px 8px rgba(0, 0, 0, 0.1));
    transition: transform 0.2s ease;
  }

  &.DesignSystem-ToggleSwitch--checked .DesignSystem-ToggleSwitch__thumb {
    transform: translateX(20px);
  }
`;

const StyledToggleSwitchRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 12px;

  .DesignSystem-ToggleSwitch__label {
    margin: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    cursor: pointer;
  }

  &.DesignSystem-ToggleSwitchRow--disabled .DesignSystem-ToggleSwitch__label {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    cursor: default;
  }
`;

/**
 * Accessible on/off toggle switch for settings and preference toggles.
 *
 * @example
 * <ToggleSwitch
 *   checked={enabled}
 *   label="Notify teachers"
 *   onChange={setEnabled}
 * />
 */
export default function ToggleSwitch({
  checked = false,
  onChange,
  label,
  disabled = false,
  id,
  className,
  "aria-label": ariaLabel,
}: ToggleSwitchProps) {
  const handleClick = () => {
    if (disabled) return;
    onChange?.(!checked);
  };

  const control = (
    <StyledToggleSwitch
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={clsx(
        "DesignSystem-ToggleSwitch",
        checked && "DesignSystem-ToggleSwitch--checked",
        disabled && "DesignSystem-ToggleSwitch--disabled",
        !label && className
      )}
      onClick={handleClick}
    >
      <span className="DesignSystem-ToggleSwitch__thumb" aria-hidden />
    </StyledToggleSwitch>
  );

  if (!label) {
    return control;
  }

  return (
    <StyledToggleSwitchRow
      className={clsx(
        "DesignSystem-ToggleSwitchRow",
        disabled && "DesignSystem-ToggleSwitchRow--disabled",
        className
      )}
    >
      {control}
      <span className="DesignSystem-ToggleSwitch__label" onClick={handleClick}>
        {label}
      </span>
    </StyledToggleSwitchRow>
  );
}
