# Customizing the Toolbar Layout in OHIF Viewer

This document explains how to modify the toolbar layout in the OHIF Viewer.

## Overview

The OHIF Viewer toolbar layout is defined in the mode configuration. Each mode (like the longitudinal mode) defines its own toolbar layout. You can customize the toolbar layout by:

1. Creating a custom configuration file
2. Overriding the mode's toolbar configuration
3. Running the viewer with your custom configuration

## How to Use the Custom Toolbar Configuration

### 1. Use the Provided Custom Configuration

We've created a custom configuration file `custom-toolbar.js` that demonstrates how to modify the toolbar layout. This configuration:

- Moves the Window Level tool to the first position in the primary toolbar
- Reorders some measurement tools
- Keeps the same set of tools but in a different order

### 2. Run OHIF with the Custom Configuration

To use this configuration, set the `APP_CONFIG` environment variable to point to the custom configuration file:

```bash
# For development
APP_CONFIG=config/custom-toolbar.js yarn run dev

# For production build
APP_CONFIG=config/custom-toolbar.js yarn run build
```

## Understanding the Configuration

The key part of the configuration is the `modesConfiguration` property, which allows overriding specific aspects of a mode:

```javascript
modesConfiguration: {
  '@ohif/mode-longitudinal': {
    onModeEnter: function ({ servicesManager, extensionManager, commandsManager }) {
      // Custom toolbar configuration
      const { toolbarService } = servicesManager.services;
      
      // Add all the toolbar buttons
      toolbarService.addButtons(toolbarButtonsPatient);
      
      // Create custom button sections with your preferred order
      toolbarService.createButtonSection('primary', [
        'WindowLevel',  // Moved to first position
        'Zoom',
        'Pan',
        // ... other buttons
      ]);
      
      // ... other button sections
    }
  }
}
```

## Creating Your Own Custom Layout

To create your own custom toolbar layout:

1. Copy the `custom-toolbar.js` file and modify it according to your needs
2. Reorder the buttons in the arrays passed to `toolbarService.createButtonSection()`
3. Add or remove buttons as needed
4. Run OHIF with your custom configuration

## Available Toolbar Buttons

The available toolbar buttons are defined in the mode's `toolbarButtonsPatient.ts` file. For the longitudinal mode, you can find them in:

```
/modes/longitudinal/src/toolbarButtonsPatient.ts
```

Each button has a unique ID that you can use in the button sections.

## Button Sections

The toolbar has three main sections:

1. `primary`: The main toolbar buttons
2. `measurementSection`: Buttons for measurement tools
3. `moreToolsSection`: Additional tools in a dropdown menu

You can customize each section independently by calling `toolbarService.createButtonSection()` with the section name and an array of button IDs.