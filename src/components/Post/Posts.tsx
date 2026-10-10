"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Input,
  Row,
  Pagination,
  PaginationItem,
  PaginationLink,
  Spinner,
} from "reactstrap";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

import PostCard from "./PostCard";
import CreatePostDialog from "./CreatePostDialog";
import EditPostDialog from "./EditPostDialog";
import DeletePostDialog from "./DeletePostDialog";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Post {
  id: string;
  img: string;
  title: string;
  subTitle: string;
  postLink: string;
  publishedAt: string;
  truncateText?: string;
  views: number;
  updatedBy?: { name?: string };
  author?: { name?: string };
  tags: { tag?: { name: string } }[];
  isDeleted: boolean;
  isPublished: boolean;
  deleteLog?: { performedBy?: { name?: string }; reason?: string } | null;
}

// ─── Debounced Input ──────────────────────────────────────────────────────────
const DebouncedInput = ({
  value: init,
  onChange,
  placeholder,
  debounce = 400,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  debounce?: number;
}) => {
  const [val, setVal] = useState(init);
  const isFirstRender = useRef(true);

  useEffect(() => {
    setVal(init);
  }, [init]);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const t = setTimeout(() => onChange(val), debounce);
    return () => clearTimeout(t);
  }, [val]);

  return (
    <Input
      value={val}
      onChange={e => setVal(e.target.value)}
      placeholder={placeholder}
      style={{ width: 200 }}
    />
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
const Posts = ({ onDataChange }: { onDataChange?: () => void }) => {
  const { data: session } = useSession();
  const isSuperuser = session?.user?.roles?.some(
    (r: any) => r.role === "superuser"
  );

  const [data, setData] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteFilter, setDeleteFilter] = useState("");
  const [sortBy, setSortBy] = useState("publishedAt");
  const [order, setOrder] = useState("desc");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        order,
        ...(search && { search }),
        ...(statusFilter && { isPublished: statusFilter }),
        ...(!isSuperuser && deleteFilter && { isDeleted: deleteFilter }),
      });

      const res = await fetch(`/api/apps/posts/panel?${params}`);
      if (!res.ok) throw new Error("Failed to fetch posts");

      const json = await res.json();
      setData(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } catch (err: any) {
      toast.error(err.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    search,
    statusFilter,
    deleteFilter,
    sortBy,
    order,
    isSuperuser,
  ]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, deleteFilter, sortBy, order, limit]);

  const handleSuccess = () => {
    fetchPosts();
    onDataChange?.();
    setSelectedPost(null);
  };

  // ── Pagination ─────────────────────────────────────────────────────────────
  const pageNumbers = (() => {
    const delta = 2,
      range: number[] = [];
    for (
      let i = Math.max(1, page - delta);
      i <= Math.min(totalPages, page + delta);
      i++
    )
      range.push(i);
    return range;
  })();

  return (
    <>
      <Card>
        <CardHeader>
          <h5 className="card-title mb-0">
            Posts
            <span className="text-muted fw-normal ms-2 fs-13">
              ({total} posts)
            </span>
          </h5>
        </CardHeader>
        <CardBody>
          {/* ── Toolbar ── */}
          <Row className="align-items-center mb-3 g-2">
            <Col sm="auto">
              <Input
                type="select"
                value={limit}
                style={{ width: 80 }}
                onChange={e => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[6, 12, 18, 24].map(v => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Input>
            </Col>
            <Col sm="auto">
              <Input
                type="select"
                value={statusFilter}
                style={{ width: 130 }}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Status</option>
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </Input>
            </Col>
            {!isSuperuser && (
              <Col sm="auto">
                <Input
                  type="select"
                  value={deleteFilter}
                  style={{ width: 130 }}
                  onChange={e => {
                    setDeleteFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All</option>
                  <option value="false">Active</option>
                  <option value="true">Deleted</option>
                </Input>
              </Col>
            )}
            <Col sm="auto">
              <Input
                type="select"
                value={sortBy}
                style={{ width: 160 }}
                onChange={e => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
              >
                <option value="publishedAt">Published Date</option>
                <option value="views">Views</option>
                <option value="title">Title</option>
                <option value="createdAt">Created Date</option>
              </Input>
            </Col>
            <Col sm="auto">
              <Input
                type="select"
                value={order}
                style={{ width: 120 }}
                onChange={e => setOrder(e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </Input>
            </Col>

            <Col sm="auto" className="ms-auto">
              <div className="d-flex gap-2">
                <DebouncedInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search posts..."
                />
                <button
                  className="btn btn-soft-secondary"
                  onClick={fetchPosts}
                  disabled={loading}
                >
                  <i
                    className={`ri-refresh-line ${loading ? "ri-spin" : ""}`}
                  />
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setOpenCreate(true)}
                >
                  <i className="ri-add-line me-1" />
                  Add Post
                </button>
              </div>
            </Col>
          </Row>

          {/* ── Grid ── */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="ri-article-line fs-1 d-block mb-2" />
              No posts found
            </div>
          ) : (
            <Row className="g-3">
              {(data ?? []).map(post => (
                <Col key={post.id} xs={12} sm={6} md={4} lg={3}>
                  <PostCard
                    post={post}
                    expanded={expandedId === post.id}
                    onToggle={() =>
                      setExpandedId(prev => (prev === post.id ? null : post.id))
                    }
                    onEdit={() => {
                      setSelectedPost(post);
                      setOpenEdit(true);
                    }}
                    onDelete={
                      isSuperuser
                        ? undefined
                        : p => {
                            setSelectedPost(p);
                            setOpenDelete(true);
                          }
                    }
                    hideDelete={!!isSuperuser}
                  />
                </Col>
              ))}
            </Row>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <small className="text-muted">
                Showing {Math.min((page - 1) * limit + 1, total)}–
                {Math.min(page * limit, total)} of {total}
              </small>
              <Pagination className="mb-0">
                <PaginationItem disabled={page === 1}>
                  <PaginationLink first onClick={() => setPage(1)} />
                </PaginationItem>
                <PaginationItem disabled={page === 1}>
                  <PaginationLink
                    previous
                    onClick={() => setPage(p => p - 1)}
                  />
                </PaginationItem>
                {pageNumbers.map(n => (
                  <PaginationItem key={n} active={n === page}>
                    <PaginationLink onClick={() => setPage(n)}>
                      {n}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem disabled={page >= totalPages}>
                  <PaginationLink next onClick={() => setPage(p => p + 1)} />
                </PaginationItem>
                <PaginationItem disabled={page >= totalPages}>
                  <PaginationLink last onClick={() => setPage(totalPages)} />
                </PaginationItem>
              </Pagination>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Dialogs ── */}
      <CreatePostDialog
        open={openCreate}
        setOpen={setOpenCreate}
        onSuccess={handleSuccess}
      />

      <EditPostDialog
        open={openEdit}
        setOpen={setOpenEdit}
        post={selectedPost}
        onSuccess={handleSuccess}
      />

      <DeletePostDialog
        open={openDelete}
        setOpen={setOpenDelete}
        post={selectedPost}
        onSuccess={handleSuccess}
      />
    </>
  );
};

export default Posts;
