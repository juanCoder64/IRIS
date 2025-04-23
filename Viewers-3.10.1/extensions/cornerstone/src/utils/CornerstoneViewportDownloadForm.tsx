import React, { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { getEnabledElement, StackViewport, BaseVolumeViewport } from '@cornerstonejs/core';
import { ToolGroupManager, segmentation, Enums } from '@cornerstonejs/tools';
import { getEnabledElement as OHIFgetEnabledElement } from '../state';
import { useSystem } from '@ohif/core/src';
import { fixWebmDuration } from '@fix-webm-duration/fix';

const DEFAULT_SIZE = 512;
const MAX_TEXTURE_SIZE = 10000;
const VIEWPORT_ID = 'cornerstone-viewport-download-form';
const DEFAULT_FPS = 15;

const FILE_TYPE_OPTIONS = [
  { value: 'jpg', label: 'JPG' },
  { value: 'png', label: 'PNG' },
  { value: 'webm', label: 'WebM Video' },
];

// Helper to trigger a download of any Blob
function downloadBlob(blob, filename, type) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${type}`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

const CornerstoneViewportDownloadForm = ({ hide, activeViewportId: activeViewportIdProp }) => {
  const { servicesManager } = useSystem();
  const { customizationService, cornerstoneViewportService } = servicesManager.services;
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [viewportDimensions, setViewportDimensions] = useState({ width: DEFAULT_SIZE, height: DEFAULT_SIZE });

  const warningState = customizationService.getCustomization('viewportDownload.warningMessage');
  const refViewportEnabledElementOHIF = OHIFgetEnabledElement(activeViewportIdProp);
  const activeViewportElement = refViewportEnabledElementOHIF?.element;
  const { viewportId: activeViewportId, renderingEngineId } = getEnabledElement(activeViewportElement);

  const renderingEngine = cornerstoneViewportService.getRenderingEngine();
  const toolGroup = ToolGroupManager.getToolGroupForViewport(activeViewportId, renderingEngineId);

  // Preserve original tool modes
  useEffect(() => {
    const savedModes = Object.entries(toolGroup.toolOptions).map(([name, opts]) => ({
      name,
      mode: opts.mode,
      bindings: opts.bindings,
    }));
    return () => {
      savedModes.forEach(({ name, mode, bindings }) => {
        toolGroup.setToolMode(name, mode, { bindings });
      });
    };
  }, []);

  const handleEnableViewport = (viewportElement) => {
    if (!viewportElement) return;
    const { viewport } = getEnabledElement(activeViewportElement);
    renderingEngine.enableElement({
      viewportId: VIEWPORT_ID,
      element: viewportElement,
      type: viewport.type,
      defaultOptions: {
        background: viewport.defaultOptions.background,
        orientation: viewport.defaultOptions.orientation,
      },
    });
  };

  const handleDisableViewport = () => {
    renderingEngine.disableElement(VIEWPORT_ID);
  };

  const handleLoadImage = async (width, height) => {
    if (!activeViewportElement) return;
    const { viewport } = getEnabledElement(activeViewportElement);
    const downloadViewport = renderingEngine.getViewport(VIEWPORT_ID);
    try {
      if (downloadViewport instanceof StackViewport) {
        await downloadViewport.setStack([viewport.getCurrentImageId()]);
        downloadViewport.setProperties(viewport.getProperties());
      } else if (downloadViewport instanceof BaseVolumeViewport) {
        const [volumeId] = viewport.getAllVolumeIds();
        downloadViewport.setVolumes([{ volumeId }]);
      }
      const reps = segmentation.state.getViewportSegmentationRepresentations(activeViewportId);
      reps.forEach(r => {
        const config = { colorLUTOrIndex: r.colorLUTIndex };
        if (r.type === Enums.SegmentationRepresentations.Labelmap) {
          segmentation.addLabelmapRepresentationToViewportMap({ [VIEWPORT_ID]: [{ ...r, config }] });
        } else if (r.type === Enums.SegmentationRepresentations.Contour) {
          segmentation.addContourRepresentationToViewportMap({ [VIEWPORT_ID]: [{ ...r, config }] });
        }
      });
      return { width: Math.min(width, MAX_TEXTURE_SIZE), height: Math.min(height, MAX_TEXTURE_SIZE) };
    } catch (error) {
      console.error('Error loading download viewport:', error);
    }
  };

  const handleToggleAnnotations = (show) => {
    const { viewportId, renderingEngineId } = getEnabledElement(activeViewportElement);
    const downloadViewport = renderingEngine.getViewport(VIEWPORT_ID);
    toolGroup.addViewport(VIEWPORT_ID, renderingEngineId);
    Object.keys(toolGroup.getToolInstances()).forEach(name => {
      if (show) toolGroup.setToolEnabled(name);
      else toolGroup.setToolDisabled(name);
    });
  };

  // Re-render on size/annotation changes
  useEffect(() => {
    setTimeout(() => {
      handleLoadImage(viewportDimensions.width, viewportDimensions.height);
      handleToggleAnnotations(showAnnotations);
      renderingEngine.resize();
      renderingEngine.render();
    }, 100);
  }, [viewportDimensions, showAnnotations]);

  // Record WebM with corrected duration
  const handleDownloadVideo = async (filename) => {
    const container = document.querySelector(`div[data-viewport-uid="default"]`);
    if (!container) return;
    const canvas = container.querySelector('canvas');
    if (!canvas) return;
    const fps = DEFAULT_FPS;
    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp8' });
    const chunks = [];

    recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.start();

    const { viewport } = getEnabledElement(activeViewportElement);
    let frameCount = 0;
    if (viewport instanceof StackViewport) {
      const ids = viewport.getImageIds();
      const delay = 1000 / fps;
      for (let i = 0; i < ids.length; i++) {
        viewport.setImageIdIndex(i);
        renderingEngine.render();
        frameCount++;
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, delay));
      }
    }
    // extra frame to flush
    await new Promise(r => setTimeout(r, 200));
    recorder.stop();

    recorder.onstop = async () => {
      try {
        const badBlob = new Blob(chunks, { type: 'video/webm' });
        // duration in ms: total frames / fps * 1000
        const durationMs = Math.round((frameCount / fps) * 1000);
        const goodBlob = await fixWebmDuration(badBlob, durationMs);
        downloadBlob(goodBlob, filename, 'webm');
      } catch (error) {
        console.error('Error fixing WebM duration:', error);
        // fallback to raw
        downloadBlob(new Blob(chunks, { type: 'video/webm' }), filename, 'webm');
      }
    };
  };

  // Unified download handler
  const handleDownload = async (filename, fileType) => {
    if (fileType === 'webm') {
      await handleDownloadVideo(filename);
    } else {
      const div = document.querySelector(`div[data-viewport-uid="default"]`);
      if (!div) return;
      const canvas = await html2canvas(div);
      const dataUrl = canvas.toDataURL(`image/${fileType}`, 1.0);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${filename}.${fileType}`;
      a.click();
    }
  };

  const ViewportDownloadFormNew = customizationService.getCustomization('ohif.captureViewportModal');

  return (
      <ViewportDownloadFormNew
          onClose={hide}
          defaultSize={DEFAULT_SIZE}
          fileTypeOptions={FILE_TYPE_OPTIONS}
          viewportId={VIEWPORT_ID}
          showAnnotations={showAnnotations}
          onAnnotationsChange={setShowAnnotations}
          dimensions={viewportDimensions}
          onDimensionsChange={setViewportDimensions}
          onEnableViewport={handleEnableViewport}
          onDisableViewport={handleDisableViewport}
          onDownload={handleDownload}
          warningState={warningState}
      />
  );
};

export default CornerstoneViewportDownloadForm;