/*! K:touch01:1:61:k0:t1o2 !*/
/**
 * KONOMI Touch Controls - Mobile 3D Navigation
 * Supports pinch-zoom, pan, rotate, and tap-to-select
 */
const TOUCH = {
  enabled: false,
  element: null,
  camera: null,
  controls: null,

  // Touch state
  touches: [],
  lastTouches: [],
  pinchDist: 0,
  lastPinchDist: 0,
  panStart: null,
  rotateStart: null,

  // Gesture thresholds
  TAP_THRESHOLD: 10,     // Max movement for tap
  TAP_DURATION: 300,     // Max duration for tap
  PINCH_SCALE: 0.01,     // Zoom sensitivity
  PAN_SCALE: 0.5,        // Pan sensitivity
  ROTATE_SCALE: 0.005,   // Rotation sensitivity

  // Callbacks
  onTap: null,
  onDoubleTap: null,
  onLongPress: null,

  // State
  tapStart: 0,
  tapPos: null,
  lastTap: 0,
  longPressTimer: null,

  init(element, camera, controls) {
    this.element = element;
    this.camera = camera;
    this.controls = controls;

    // Check for touch support
    this.enabled = 'ontouchstart' in window;

    if (!this.enabled) {
      console.log('Touch not supported, using mouse');
      return this;
    }

    // Disable default touch behaviors
    element.style.touchAction = 'none';

    // Add event listeners
    element.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    element.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    element.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
    element.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false });

    console.log('Touch controls initialized');
    return this;
  },

  onTouchStart(e) {
    e.preventDefault();
    this.lastTouches = this.touches;
    this.touches = Array.from(e.touches);

    if (this.touches.length === 1) {
      // Single touch - potential tap, pan, or rotate
      this.tapStart = Date.now();
      this.tapPos = { x: this.touches[0].clientX, y: this.touches[0].clientY };
      this.panStart = { ...this.tapPos };
      this.rotateStart = { ...this.tapPos };

      // Long press detection
      this.longPressTimer = setTimeout(() => {
        if (this.onLongPress && this.touches.length === 1) {
          const moved = this.getMovement(this.touches[0], this.tapPos);
          if (moved < this.TAP_THRESHOLD) {
            this.onLongPress(this.tapPos);
          }
        }
      }, 500);
    }

    if (this.touches.length === 2) {
      // Two fingers - pinch zoom
      this.lastPinchDist = this.getPinchDistance();
      clearTimeout(this.longPressTimer);
    }
  },

  onTouchMove(e) {
    e.preventDefault();
    this.lastTouches = this.touches;
    this.touches = Array.from(e.touches);

    clearTimeout(this.longPressTimer);

    if (this.touches.length === 1 && this.controls) {
      // Single finger - rotate
      const touch = this.touches[0];
      const dx = touch.clientX - this.rotateStart.x;
      const dy = touch.clientY - this.rotateStart.y;

      // Update orbit controls
      this.controls.rotateLeft(dx * this.ROTATE_SCALE);
      this.controls.rotateUp(dy * this.ROTATE_SCALE);

      this.rotateStart = { x: touch.clientX, y: touch.clientY };
    }

    if (this.touches.length === 2) {
      // Two fingers - pinch zoom and pan
      const pinchDist = this.getPinchDistance();
      const pinchDelta = pinchDist - this.lastPinchDist;

      if (this.controls) {
        // Zoom
        if (Math.abs(pinchDelta) > 2) {
          const scale = 1 - pinchDelta * this.PINCH_SCALE;
          this.controls.dollyIn(scale);
        }

        // Pan (average of two fingers)
        const center = this.getPinchCenter();
        const lastCenter = this.getLastPinchCenter();

        if (lastCenter) {
          const dx = center.x - lastCenter.x;
          const dy = center.y - lastCenter.y;
          this.controls.pan(dx * this.PAN_SCALE, dy * this.PAN_SCALE);
        }
      }

      this.lastPinchDist = pinchDist;
    }

    if (this.touches.length === 3 && this.controls) {
      // Three fingers - pan
      const touch = this.touches[0];
      const dx = touch.clientX - this.panStart.x;
      const dy = touch.clientY - this.panStart.y;

      this.controls.pan(dx * this.PAN_SCALE, dy * this.PAN_SCALE);
      this.panStart = { x: touch.clientX, y: touch.clientY };
    }
  },

  onTouchEnd(e) {
    e.preventDefault();
    clearTimeout(this.longPressTimer);

    const wasOneTouch = this.touches.length === 1;
    this.touches = Array.from(e.touches);

    if (wasOneTouch && this.touches.length === 0) {
      // Check for tap
      const duration = Date.now() - this.tapStart;
      const lastTouch = this.lastTouches[0];

      if (lastTouch && duration < this.TAP_DURATION) {
        const moved = this.getMovement(lastTouch, this.tapPos);

        if (moved < this.TAP_THRESHOLD) {
          // It's a tap!
          const now = Date.now();

          if (now - this.lastTap < 300 && this.onDoubleTap) {
            // Double tap
            this.onDoubleTap({ x: lastTouch.clientX, y: lastTouch.clientY });
          } else if (this.onTap) {
            // Single tap
            this.onTap({ x: lastTouch.clientX, y: lastTouch.clientY });
          }

          this.lastTap = now;
        }
      }
    }

    this.lastTouches = this.touches;
  },

  // Get distance between two touches
  getPinchDistance() {
    if (this.touches.length < 2) return 0;
    const dx = this.touches[0].clientX - this.touches[1].clientX;
    const dy = this.touches[0].clientY - this.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // Get center point of two touches
  getPinchCenter() {
    if (this.touches.length < 2) return null;
    return {
      x: (this.touches[0].clientX + this.touches[1].clientX) / 2,
      y: (this.touches[0].clientY + this.touches[1].clientY) / 2
    };
  },

  getLastPinchCenter() {
    if (this.lastTouches.length < 2) return null;
    return {
      x: (this.lastTouches[0].clientX + this.lastTouches[1].clientX) / 2,
      y: (this.lastTouches[0].clientY + this.lastTouches[1].clientY) / 2
    };
  },

  // Get movement distance
  getMovement(touch, start) {
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // Convert touch to normalized coordinates (-1 to 1)
  normalize(pos) {
    const rect = this.element.getBoundingClientRect();
    return {
      x: ((pos.x - rect.left) / rect.width) * 2 - 1,
      y: -((pos.y - rect.top) / rect.height) * 2 + 1
    };
  },

  // Show touch indicator
  showIndicator(pos, type = 'tap') {
    const indicator = document.createElement('div');
    indicator.className = 'touch-indicator touch-' + type;
    indicator.style.cssText = `
      position: fixed;
      left: ${pos.x}px;
      top: ${pos.y}px;
      width: 40px;
      height: 40px;
      margin: -20px;
      border-radius: 50%;
      border: 2px solid #00ff88;
      pointer-events: none;
      animation: touchPulse 0.3s ease-out forwards;
    `;
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 300);
  }
};

// Add CSS animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes touchPulse {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(1.5); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

if (typeof module !== 'undefined') module.exports = TOUCH;
