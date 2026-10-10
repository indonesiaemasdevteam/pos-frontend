"use client";

import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  Collapse,
} from "reactstrap";

interface PostTag {
  tag?: { name: string };
  name?: string;
}

interface PostAuthor {
  name?: string;
}

interface DeleteLog {
  performedBy?: { name?: string };
  reason?: string;
}

interface Post {
  id: string;
  img: string;
  title: string;
  subTitle: string;
  postLink: string;
  publishedAt: string;
  truncateText?: string;
  views: number;
  updatedBy?: PostAuthor;
  author?: PostAuthor;
  tags: PostTag[];
  isDeleted: boolean;
  isPublished: boolean;
  deleteLog?: DeleteLog | null;
}

interface PostCardProps {
  post: Post;
  expanded: boolean;
  onToggle: () => void;
  onDelete?: (post: Post) => void;
  onEdit?: (post: Post) => void;
  hideDelete?: boolean;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const PostCard = ({
  post,
  expanded,
  onToggle,
  onDelete,
  onEdit,
  hideDelete = false,
}: PostCardProps) => {
  const {
    img,
    title,
    subTitle,
    postLink,
    publishedAt,
    truncateText,
    views = 0,
    updatedBy,
    author,
    tags = [],
    isDeleted = false,
    isPublished = true,
    deleteLog = null,
  } = post;

  const isExternal = postLink ? postLink.startsWith("http") : false;

  return (
    <Card className="h-100 shadow-sm">
      {/* Image */}
      <div className="position-relative">
        <img
          src={img}
          alt={title}
          className="card-img-top"
          style={{
            height: 160,
            objectFit: "cover",
            filter: isDeleted ? "grayscale(1) brightness(0.75)" : "none",
          }}
          onError={e => {
            (e.target as HTMLImageElement).src = "/images/placeholder.jpg";
          }}
        />

        {/* Status badge */}
        <div className="position-absolute top-0 end-0 m-2">
          {isDeleted ? (
            <span className="badge bg-danger">DELETED</span>
          ) : isPublished ? (
            <span className="badge bg-success">PUBLISHED</span>
          ) : (
            <span className="badge bg-warning text-dark">DRAFT</span>
          )}
        </div>

        {/* Deleted overlay */}
        {isDeleted && (
          <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ background: "rgba(0,0,0,0.35)" }}
          >
            <span
              className="fw-bold text-danger fs-3"
              style={{
                transform: "rotate(-20deg)",
                textShadow: "0 0 10px rgba(0,0,0,0.7)",
              }}
            >
              DELETED
            </span>
          </div>
        )}
      </div>

      <CardBody className="d-flex flex-column">
        {/* Title */}
        <h6
          className="fw-semibold mb-1 lh-base"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </h6>

        {/* Subtitle */}
        <p
          className="text-muted small mb-2"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {truncateText || subTitle}
        </p>

        {/* Meta */}
        <div className="small text-muted mb-2">
          <div>
            <i className="ri-calendar-line me-1" />
            {formatDate(publishedAt)}
          </div>
          <div>
            <i className="ri-user-line me-1" />
            {author?.name || "Unknown"}
          </div>
          <div>
            {isDeleted ? (
              <>
                <i className="ri-delete-bin-line me-1" />
                Deleted by: {deleteLog?.performedBy?.name || "-"}
              </>
            ) : (
              <>
                <i className="ri-edit-line me-1" />
                Updated by: {updatedBy?.name || "-"}
              </>
            )}
          </div>
          {isDeleted && deleteLog?.reason && (
            <div className="text-truncate">
              <i className="ri-information-line me-1" />
              Reason: {deleteLog.reason}
            </div>
          )}
          <div>
            <i className="ri-eye-line me-1" />
            {views} views
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="d-flex flex-wrap gap-1 mb-2">
            {tags.map((pt, idx) => (
              <Badge
                key={idx}
                color="primary"
                pill
                className="fw-normal"
                style={{ fontSize: 11 }}
              >
                {pt?.tag?.name || pt?.name || "-"}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="d-flex gap-2 mt-auto pt-2 flex-wrap">
          <Link
            href={postLink}
            target={isExternal ? "_blank" : "_self"}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className={`btn btn-sm btn-primary ${isDeleted ? "disabled" : ""}`}
          >
            <i className="ri-eye-line me-1" />
            View
          </Link>

          {!isDeleted && (
            <>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => onEdit?.(post)}
              >
                <i className="ri-pencil-line me-1" />
                Edit
              </button>

              {!hideDelete && (
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete?.(post)}
                >
                  <i className="ri-delete-bin-line me-1" />
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </CardBody>

      <CardFooter className="d-flex justify-content-between align-items-center py-2 px-3 bg-transparent border-top">
        <button
          className="btn btn-sm btn-ghost-secondary p-0 fw-normal"
          style={{ fontSize: 12 }}
          onClick={onToggle}
        >
          {expanded ? "Hide Details" : "Details"}
        </button>
        <button
          className="btn btn-sm btn-ghost-secondary p-0"
          onClick={onToggle}
        >
          <i
            className={expanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
          />
        </button>
      </CardFooter>

      <Collapse isOpen={expanded}>
        <div className="border-top px-3 py-2">
          <p className="text-muted small mb-0">{subTitle}</p>
        </div>
      </Collapse>
    </Card>
  );
};

export default PostCard;
