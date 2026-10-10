import React from "react";
import { Container } from "reactstrap";
import BreadCrumb from "@components/Common/BreadCrumb";
import MediaView from "src/components/Media/MediaView";

const MediaPage = () => {
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Add Media" pageTitle="Media" />
          <MediaView />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default MediaPage;
