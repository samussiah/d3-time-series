import updatefocusRing from './functions/updateFocusRing';
import updateTip from './functions/updateTip';

export default function mouseOut(mousevline, annotationsContainer, xscale, yscale, tooltipDiv) {
    mousevline.datum({ x: null, visible: false });
    mousevline.update();
    updatefocusRing(null, annotationsContainer, xscale, yscale);
    updateTip(null, tooltipDiv);
}
