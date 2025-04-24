window.config = {
  ...window.config,
  name: 'config/custom-toolbar.js',
  modesConfiguration: {
    '@ohif/mode-patient': {
      onModeEnter: function ({ servicesManager, extensionManager, commandsManager }) {
        const { measurementService, toolbarService, toolGroupService, customizationService } =
          servicesManager.services;

        measurementService.clearMeasurements();

        // Init Default and SR ToolGroups
        const { initToolGroups } = window.longitudinalMode;
        initToolGroups(extensionManager, toolGroupService, commandsManager);

        // Get the toolbar buttons from the mode
        const { toolbarButtons } = window.longitudinalMode;
        toolbarService.addButtons(toolbarButtons);

        // Create a custom primary toolbar section with a different order of buttons
        toolbarService.createButtonSection('primary', [
          // You can reorder these buttons or remove ones you don't need
          'WindowLevel',  // Move WindowLevel to the first position
          'Zoom',
          'Pan',
          'MeasurementTools',
          'Layout',
          'Capture',
          'Crosshairs',
          'MoreTools',
        ]);

        // You can also customize the measurement tools section
        toolbarService.createButtonSection('measurementSection', [
          'Length',
          'Bidirectional',
          'ArrowAnnotate',
          'EllipticalROI',
          'CircleROI',  // Changed order - moved CircleROI before RectangleROI
          'RectangleROI',
          'PlanarFreehandROI',
          'SplineROI',
          'LivewireContour',
        ]);

        // And the more tools section
        toolbarService.createButtonSection('moreToolsSection', [
          'Reset',
          'rotate-right',
          'flipHorizontal',
          'ImageSliceSync',
          'ReferenceLines',
          'ImageOverlayViewer',
          'StackScroll',
          'invert',
          'Probe',
          'Cine',
          'Angle',
          'CobbAngle',
          'Magnify',
          'CalibrationLine',
          'TagBrowser',
          'AdvancedMagnify',
          'UltrasoundDirectionalTool',
          'WindowLevelRegion',
        ]);

        customizationService.setCustomizations({
          'panelSegmentation.disableEditing': {
            $set: true,
          },
        });
      }
    }
  }
};