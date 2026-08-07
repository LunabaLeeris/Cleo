import React, { useEffect, useRef, useState } from 'react';
import {
  AvatarCompositor,
  defaultAvatarConfig,
} from '../../src/avatar';
import { Button, Badge } from './ui';

interface AvatarStageProps {
  speechBubbleText: string;
  isBubbleVisible: boolean;
  activeExpressionLabel: string;
  renderScale?: number;
  theme?: 'cream' | 'grid';
  onThemeChange?: (theme: 'cream' | 'grid') => void;
  onCompositorInit?: (compositor: AvatarCompositor) => void;
  onBlink?: () => void;
}

// Controls the interactive avatar canvas, compositor loop, drag events, and speech bubble.
export const AvatarStage: React.FC<AvatarStageProps> = ({
  speechBubbleText,
  isBubbleVisible,
  activeExpressionLabel,
  renderScale = 6,
  theme = 'cream',
  onThemeChange,
  onCompositorInit,
  onBlink,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [masterTick, setMasterTick] = useState<number>(0);
  const compositorRef = useRef<AvatarCompositor | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync renderScale prop changes to active compositor.
  useEffect(() => {
    if (compositorRef.current && renderScale !== undefined) {
      compositorRef.current.setScale(renderScale);
    }
  }, [renderScale]);

  // Initialize the avatar compositor when component mounts.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const compositor = new AvatarCompositor(canvas, {
      ...defaultAvatarConfig,
      scale: renderScale,
    });
    compositorRef.current = compositor;

    let isSubscribed = true;

    compositor.init().then(() => {
      if (!isSubscribed) return;
      compositor.start();
      if (onCompositorInit) {
        onCompositorInit(compositor);
      }
    });

    const intervalId = setInterval(() => {
      if (compositorRef.current) {
        setMasterTick(compositorRef.current.getGlobalFrame());
      }
    }, 100);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
      compositor.stop();
    };
  }, []);

  // Handle drag interactions for mouse and touch events.
  const startDrag = (clientX: number, clientY: number) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    isDraggingRef.current = true;
    wrapper.classList.remove('grab-cursor');
    wrapper.classList.add('grabbing-cursor');

    const rect = wrapper.getBoundingClientRect();
    offsetRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    if (compositorRef.current) {
      compositorRef.current.setExpression('question', 'Dragging');
    }
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const wrapper = wrapperRef.current;
    const stage = stageRef.current;
    if (!wrapper || !stage) return;

    const stageRect = stage.getBoundingClientRect();
    let newX = clientX - stageRect.left - offsetRef.current.x;
    let newY = clientY - stageRect.top - offsetRef.current.y;

    newX = Math.max(10, Math.min(stageRect.width - wrapper.offsetWidth - 10, newX));
    newY = Math.max(10, Math.min(stageRect.height - wrapper.offsetHeight - 10, newY));

    wrapper.style.position = 'absolute';
    wrapper.style.left = `${newX}px`;
    wrapper.style.top = `${newY}px`;
  };

  const endDrag = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const wrapper = wrapperRef.current;
    if (wrapper) {
      wrapper.classList.remove('grabbing-cursor');
      wrapper.classList.add('grab-cursor');
    }
    if (compositorRef.current) {
      compositorRef.current.setExpression('idle');
    }
  };

  // Attach global pointer move and release listeners.
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      moveDrag(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      endDrag();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      e.preventDefault();
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
      endDrag();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  const handleCanvasClick = () => {
    if (compositorRef.current) {
      compositorRef.current.setExpression('blink', 'Blinking');
    }
    if (onBlink) {
      onBlink();
    }
  };

  return (
    <section className="avatar-stage-container" id="stage-container">
      <div className="stage-card panel-bg-stage" id="avatar-stage" ref={stageRef}>
        {/* Top Left Live v1.0 Badge */}
        <div className="stage-overlay-top-left">
          <Badge variant="pill" icon={<span className="pulse-dot" />}>
            Live v1.0
          </Badge>
        </div>

        {/* Top Right Cream/Grid Theme Toggle */}
        {onThemeChange && (
          <div className="stage-overlay-top-right">
            <div className="theme-selector">
              <Button
                id="theme-cream-btn"
                variant="theme"
                active={theme === 'cream'}
                title="Cozy Cream Pixel Theme"
                onClick={() => onThemeChange('cream')}
              >
                Cream
              </Button>
              <Button
                id="theme-grid-btn"
                variant="theme"
                active={theme === 'grid'}
                title="Pixel Grid Stage"
                onClick={() => onThemeChange('grid')}
              >
                Grid
              </Button>
            </div>
          </div>
        )}

        <div
          id="web-avatar-wrapper"
          className="avatar-wrapper grab-cursor"
          ref={wrapperRef}
          onMouseDown={(e) => {
            if (e.button === 0) startDrag(e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY);
          }}
        >
          <div
            id="web-speech-bubble"
            className={`speech-bubble ${isBubbleVisible ? 'visible' : ''}`}
          >
            {speechBubbleText}
          </div>
          <canvas
            id="web-avatar-canvas"
            ref={canvasRef}
            onClick={handleCanvasClick}
          />
        </div>

        <div id="drag-hint" className="drag-hint">
          <span className="pixel-icon">🖐️</span> Drag CHLEO anywhere on stage
        </div>
      </div>

      <div className="stage-info-bar">
        <div className="info-item">
          <span className="info-label">Expression:</span>
          <span id="active-expression-label" className="info-value">
            {activeExpressionLabel}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Master Tick:</span>
          <span id="master-tick-label" className="info-value">
            Frame {masterTick}
          </span>
        </div>
      </div>
    </section>
  );
};
