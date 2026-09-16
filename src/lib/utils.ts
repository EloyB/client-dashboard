import { createCn } from 'cn/config';

// Our custom type-scale utilities (overline/small/body/h3/h2/h1/display, see
// docs/design/globals.css) share the "text-" prefix with color utilities.
// Without this, cn() treats them as conflicting text-color classes and
// silently drops whichever comes first (e.g. `text-primary-foreground
// text-small` loses the color).
export const cn = createCn({
  extend: {
    classGroups: {
      'font-size': [{ text: ['overline', 'small', 'body', 'h3', 'h2', 'h1', 'display'] }],
    },
  },
});
