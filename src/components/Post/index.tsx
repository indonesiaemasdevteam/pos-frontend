"use client"

import { useCallback, useState } from "react"
import { Container } from "reactstrap"
import PostListCards from "./PostListCards"
import Posts from "./Posts"

const PostLists = () => {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleDataChange = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  return (
    <Container fluid>
      <div className="mb-4">
        <PostListCards refreshKey={refreshKey} />
      </div>
      <Posts onDataChange={handleDataChange} />
    </Container>
  )
}

export default PostLists
