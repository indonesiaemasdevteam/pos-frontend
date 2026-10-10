"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, Col, Row } from "reactstrap";

interface Stats {
  total: number;
  active: number;
  inactive: number;
  loggedInToday: number;
}

interface StatCard {
  title: string;
  count: number;
  icon: string;
  color: string;
  subtitle: string;
}

const UserListCards = ({ refreshKey }: { refreshKey: number }) => {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    inactive: 0,
    loggedInToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const today = new Date().toLocaleDateString("en-CA", {
          timeZone: "Asia/Jakarta",
        });

        const [totalRes, activeRes, inactiveRes, loginTodayRes] =
          await Promise.all([
            fetch("/api/apps/users/panel?page=1&limit=1"),
            fetch("/api/apps/users/panel?page=1&limit=1&status=active"),
            fetch("/api/apps/users/panel?page=1&limit=1&status=inactive"),
            fetch(
              `/api/apps/users/panel?page=1&limit=1&lastLoginDate=${today}`
            ),
          ]);

        const [totalJson, activeJson, inactiveJson, loginTodayJson] =
          await Promise.all([
            totalRes.json(),
            activeRes.json(),
            inactiveRes.json(),
            loginTodayRes.json(),
          ]);

        setStats({
          total: totalJson.total || 0,
          active: activeJson.total || 0,
          inactive: inactiveJson.total || 0,
          loggedInToday: loginTodayJson.total || 0,
        });
      } catch (err) {
        console.error("❌ Failed to fetch user stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [refreshKey]); // ← re-fetch setiap refreshKey berubah

  const cards: StatCard[] = [
    {
      title: "Total Users",
      count: stats.total,
      icon: "ri-group-line",
      color: "primary",
      subtitle: "All registered users",
    },
    {
      title: "Active",
      count: stats.active,
      icon: "ri-user-follow-line",
      color: "success",
      subtitle: "Active accounts",
    },
    {
      title: "Inactive",
      count: stats.inactive,
      icon: "ri-user-unfollow-line",
      color: "secondary",
      subtitle: "Inactive accounts",
    },
    {
      title: "Logged In Today",
      count: stats.loggedInToday,
      icon: "ri-time-line",
      color: "info",
      subtitle: "Last login today",
    },
  ];

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
                    {loading ? (
                      <span className="placeholder col-4 rounded" />
                    ) : (
                      card.count.toLocaleString()
                    )}
                  </h2>
                  <p className="mb-0 text-muted">
                    <span className="badge bg-light text-muted me-1 align-middle">
                      {card.subtitle}
                    </span>
                  </p>
                </div>
                <div className="avatar-sm flex-shrink-0">
                  <span
                    className={`avatar-title bg-${card.color}-subtle rounded-circle fs-2`}
                  >
                    <i className={`${card.icon} text-${card.color}`} />
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default UserListCards;
