import { useQuery } from "@apollo/client";
import moment from "moment";
import { useRouter } from "next/router";

import { GET_MY_RESOURCES, GET_PUBLIC_RESOURCES } from "../../Queries/Resource";
import DeleteResource from "./DeleteResource";
import ResourceCard from "./ResourceCard";
import MessageCard from "../../DesignSystem/MessageCard";
import { stripHtml } from "../../Proposal/Card/Forms/utils";

import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import useTranslation from "next-translate/useTranslation";

function formatResourceDates(resource, t) {
  const created = `${t("boardManagement.created", {}, { default: "Created" })}: ${moment(
    resource.createdAt
  ).format("MMMM D, YYYY")}`;
  if (!resource.updatedAt) return created;
  return `${created} · ${t("boardManagement.updated", {}, { default: "Updated" })}: ${moment(
    resource.updatedAt
  ).format("MMMM D, YYYY")}`;
}

export default function MyResourcesList({
  query,
  user,
  searchTerm,
  filter,
  onPreview,
  onShare,
}) {
  const { t } = useTranslation("classes");
  const router = useRouter();

  const { data, error, loading } = useQuery(GET_MY_RESOURCES, {
    variables: { id: user?.id },
  });

  let resources = data?.resources ? [...data.resources] : [];

  if (searchTerm) {
    resources = resources.filter(
      (r) =>
        stripHtml(r.title).toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  resources = [...resources].sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt).getTime();
    return bTime - aTime;
  });
  if (filter === "public") {
    resources = resources.filter((r) => r.isPublic === true);
  }

  const refetchQueries = [
    {
      query: GET_MY_RESOURCES,
      variables: { id: user?.id },
    },
    {
      query: GET_PUBLIC_RESOURCES,
    },
  ];

  if (loading) return <p>{t("boardManagement.loading")}</p>;
  if (error) return <p>{t("boardManagement.errorLoadingResources")}</p>;
  const permissionNames = user.permissions?.map((p) => p?.name) || [];
  const isStudentOnly =
    permissionNames.includes("STUDENT") &&
    !permissionNames.includes("TEACHER") &&
    !permissionNames.includes("ADMIN") &&
    !permissionNames.includes("MENTOR");
  if (isStudentOnly) {
    return <></>;
  }

  if (resources.length === 0) {
    return (
      <MessageCard
        variant="information"
        message={
          searchTerm || filter !== "all"
            ? t("boardManagement.emptySearchResults", {}, {
                default: "No resources match your search or filter.",
              })
            : t("boardManagement.emptyMyResources", {}, {
                default: "You have not created any resources yet.",
              })
        }
      >
      </MessageCard>
    );
  }

  return (
    <div className="board">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          typeLabel={
            resource.isPublic
              ? t("boardManagement.publicChip", {}, { default: "Public" })
              : null
          }
          title={stripHtml(resource.title)}
          subtitle={`${t("boardManagement.author", {}, { default: "Author" })}: ${
            resource.author?.username || t("boardManagement.notAvailable")
          }`}
          description={formatResourceDates(resource, t)}
          chips={
            resource.collaborators?.length > 0
              ? resource.collaborators.map((c) => (
                  <Chip
                    key={c.id}
                    variant="static"
                    tone="neutral"
                    label={c.username}
                  />
                ))
              : null
          }
          actions={
            <>
              <Button variant="subtle" onClick={() => onPreview(resource.id)}>
                {t("boardManagement.preview")}
              </Button>
              <Button
                variant="subtle"
                onClick={() =>
                  router.push(`/dashboard/resources/edit?id=${resource.id}`)
                }
              >
                {t("boardManagement.edit")}
              </Button>
              <Button
                variant="subtle"
                onClick={() =>
                  router.push(
                    `/dashboard/resources/duplicate?id=${resource.id}`
                  )
                }
              >
                {t("boardManagement.duplicate")}
              </Button>
              <Button variant="tonal" style={{ color: "var(--MH-Theme-Status-Info-dark, #004F94)", background: "var(--MH-Theme-Status-Info-light, #E6F0FA)" }} onClick={() => onShare(resource.id)}>
                {t("boardManagement.share")}
              </Button>
              <DeleteResource
                resourceId={resource.id}
                refetchQueries={refetchQueries}
              >
                <Button variant="tonal" style={{ color: "var(--MH-Theme-Status-Danger-dark, #95221D)", background: "var(--MH-Theme-Status-Danger-light, #FEECEB)" }}>{t("boardManagement.delete")}</Button>
              </DeleteResource>
            </>
          }
        />
      ))}
    </div>
  );
}
