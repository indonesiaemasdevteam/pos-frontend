"use client";

import { Row, Col } from "reactstrap";
import { useMediaForm } from "@/hooks/useMediaForm";
import MediaHero from "./MediaHero";
import MediaForm from "./MediaForm";
import MediaPreview from "./MediaPreview";
import ConfirmSubmitDialog from "./ConfirmSubmitDialog";

export default function MediaView() {
  const m = useMediaForm();

  return (
    <div className="px-3 px-md-4 py-3 py-md-4 w-100">
      <MediaHero type={m.type} />

      <Row className="g-3">
        <Col xs={12} md={6}>
          <MediaForm
            type={m.type}
            busy={m.busy}
            useUpload={m.useUpload}
            setUseUpload={m.setUseUpload}
            handleChangeType={m.handleChangeType}
            urlInput={m.urlInput}
            setUrlInput={m.setUrlInput}
            inputRef={m.inputRef}
            handleUpload={m.handleUpload}
            isUploadingImage={m.isUploadingImage}
            loadingValidate={m.loadingValidate}
            isSwitchingType={m.isSwitchingType}
            isDeletingImage={m.isDeletingImage}
            error={m.error}
            submitError={m.submitError}
            title={m.title}
            setTitle={m.setTitle}
            description={m.description}
            setDescription={m.setDescription}
            editor={m.editor}
            setEditor={m.setEditor}
            note={m.note}
            setNote={m.setNote}
            tags={m.tags}
            setTags={m.setTags}
            isFeatured={m.isFeatured}
            setIsFeatured={m.setIsFeatured}
            sortOrder={m.sortOrder}
            setSortOrder={m.setSortOrder}
            isPublished={m.isPublished}
            setIsPublished={m.setIsPublished}
            handleResetAll={m.handleResetAll}
            openConfirm={m.openConfirm}
            setOpenConfirm={m.setOpenConfirm}
            submitLoading={m.submitLoading}
            allFilled={m.allFilled}
            deleteUploadedImageIfAny={m.deleteUploadedImageIfAny}
            clearImageMeta={m.clearImageMeta}
            resetUrlInstant={m.resetUrlInstant}
          />
        </Col>

        <Col xs={12} md={6}>
          <MediaPreview
            type={m.type}
            canPreview={m.canPreview}
            embedUrl={m.embedUrl ?? undefined}
            finalUrl={m.finalUrl || undefined}
            loadingValidate={m.loadingValidate}
            isUploadingImage={m.isUploadingImage}
            isDeletingImage={m.isDeletingImage}
            setError={m.setError}
            imgWidth={m.imgWidth ?? undefined}
            imgHeight={m.imgHeight ?? undefined}
            imgBytes={m.imgBytes ?? undefined}
          />
        </Col>
      </Row>

      <ConfirmSubmitDialog
        open={m.openConfirm}
        onClose={() => m.setOpenConfirm(false)}
        onCancelAndCleanup={m.handleCancelConfirm}
        onSubmit={m.handleSubmit}
        submitLoading={m.submitLoading}
        type={m.type}
      />
    </div>
  );
}
