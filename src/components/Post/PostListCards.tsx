"use client"

import { useEffect, useState } from "react"
import { Card, CardBody, Col, Row } from "reactstrap"

interface Stats {
  total:          number
  published:      number
  drafts:         number
  publishedToday: number
}

interface StatCard {
  title:    string
  count:    number
  icon:     string
  color:    string
  subtitle: string
}

const PostListCards = ({ refreshKey = 0 }: { refreshKey?: number }) => {
  const [stats, setStats]     = useState<Stats>({ total: 0, published: 0, drafts: 0, publishedToday: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })

        const [totalRes, publishedRes, draftRes, todayRes] = await Promise.all([
          fetch("/api/apps/posts/panel?page=1&limit=1"),
          fetch("/api/apps/posts/panel?page=1&limit=1&isPublished=true"),
          fetch("/api/apps/posts/panel?page=1&limit=1&isPublished=false"),
          fetch(`/api/apps/posts/panel?page=1&limit=1&publishedDate=${today}`),
        ])

        const [totalJson, publishedJson, draftJson, todayJson] = await Promise.all([
          totalRes.json(), publishedRes.json(), draftRes.json(), todayRes.json(),
        ])

        setStats({
          total:          totalJson.total     || 0,
          published:      publishedJson.total || 0,
          drafts:         draftJson.total     || 0,
          publishedToday: todayJson.total     || 0,
        })
      } catch (err) {
        console.error("❌ Failed to fetch post stats:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [refreshKey])

  const cards: StatCard[] = [
    { title: "Total Posts",    count: stats.total,          icon: "ri-article-line",    color: "primary",   subtitle: "All posts" },
    { title: "Published",      count: stats.published,      icon: "ri-checkbox-circle-line", color: "success",   subtitle: "Published posts" },
    { title: "Drafts",         count: stats.drafts,         icon: "ri-draft-line",      color: "warning",   subtitle: "Unpublished / drafts" },
    { title: "Today's Posts",  count: stats.publishedToday, icon: "ri-calendar-check-line", color: "info",      subtitle: "Published today" },
  ]

  return (
    <Row>
      {cards.map((card, i) => (
        <Col key={i} xxl={3} sm={6}>
          <Card className="card-animate">
            <CardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <p className="fw-medium text-muted mb-0">{card.title}</p>
                  <h2 className="mt-4 ff-secondary fw-semibold">
                    {loading
                      ? <span className="placeholder col-4 rounded" />
                      : card.count.toLocaleString()
                    }
                  </h2>
                  <p className="mb-0 text-muted">
                    <span className="badge bg-light text-muted me-1 align-middle">
                      {card.subtitle}
                    </span>
                  </p>
                </div>
                <div className="avatar-sm flex-shrink-0">
                  <span className={`avatar-title bg-${card.color}-subtle rounded-circle fs-2`}>
                    <i className={`${card.icon} text-${card.color}`} />
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default PostListCards
