import React from 'react';
import { useToolbar } from '@ohif/core';

export function Toolbar({ servicesManager, buttonSection = 'primary' }) {
  const { toolbarButtonsPatient, onInteraction } = useToolbar({
    servicesManager,
    buttonSection,
  });

  if (!toolbarButtonsPatient.length) {
    return null;
  }

  return (
    <>
      {toolbarButtonsPatient?.map(toolDef => {
        if (!toolDef) {
          return null;
        }

        const { id, Component, componentProps } = toolDef;
        const tool = (
          <Component
            key={id}
            id={id}
            onInteraction={onInteraction}
            servicesManager={servicesManager}
            {...componentProps}
          />
        );

        return <div key={id}>{tool}</div>;
      })}
    </>
  );
}
