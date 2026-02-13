# Neon Glow Button System

A high-impact, reusable button component system for Deep Tech themed interfaces, featuring impressive electric glow effects.

## Color Palette

- **Button Background**: Bright Cobalt (`#1E40AF`)
- **Glow/Light**: Ice Blue (`#7DD3FC`)
- **Text**: White (`#FFFFFF`)

## Available Classes

### Primary Button - `.btn-glow`

The main neon glow button with impressive hover effects. Perfect for CTAs and primary actions.

```jsx
<button className="btn-glow">Get Started</button>

// With icon
<button className="btn-glow">
  <Rocket className="w-5 h-5 mr-2" />
  Launch Project
</button>
```

**Features:**
- Bright Cobalt base color with slight elevation
- Electric Ice Blue glow on hover/focus
- Layered box-shadows for depth
- Smooth 300ms transitions
- 2px lift effect on hover
- Full accessibility support

### Size Variants

Choose from 4 size options:

```jsx
<button className="btn-glow-sm">Small Button</button>
<button className="btn-glow">Default Size</button>
<button className="btn-glow-lg">Large Button</button>
<button className="btn-glow-xl">Extra Large</button>
```

**Sizes:**
- `btn-glow-sm`: Compact size (px-6 py-3, text-sm)
- `btn-glow`: Default size (px-8 py-4, base text)
- `btn-glow-lg`: Large size (px-10 py-5, text-lg)
- `btn-glow-xl`: Extra large (px-12 py-6, text-xl)

### Outline Variant - `.btn-glow-outline`

Transparent background with glowing border. Fills with glow on hover for a dramatic effect.

```jsx
<button className="btn-glow-outline">Learn More</button>

// With icon
<button className="btn-glow-outline">
  Documentation
  <ArrowRight className="w-5 h-5 ml-2" />
</button>
```

**Features:**
- Transparent background
- Ice Blue text color
- Bright Cobalt border
- Fills with glow effect on hover
- Perfect for secondary actions

## States

All button variants support the following states:

### Normal State
- Base Bright Cobalt background
- Subtle shadow for depth
- Slight inset highlight

### Hover State
- Intense Ice Blue glow (40px spread)
- Multiple layered shadows
- 2px upward lift
- Brighter appearance
- Ring glow effect

### Focus State (`:focus-visible`)
- Same as hover
- Prominent focus ring for accessibility
- 4px ring with Ice Blue color

### Active State
- Reduced glow intensity
- Returns to base position
- Maintains visual feedback

### Disabled State
- 50% opacity
- No hover effects
- Cursor: not-allowed
- Minimal shadows

## Implementation

### In Your Component

Simply add the class name to any button element:

```jsx
export function MyComponent() {
  return (
    <div>
      <button className="btn-glow" onClick={handleClick}>
        Primary Action
      </button>

      <button className="btn-glow-outline" onClick={handleSecondary}>
        Secondary Action
      </button>
    </div>
  )
}
```

### With React Components

Works with any component that accepts className:

```jsx
import { Button } from '@/components/ui/button'

<Button className="btn-glow">
  Click Me
</Button>
```

### With Link Components

```jsx
import Link from 'next/link'

<Link href="/dashboard">
  <button className="btn-glow-lg">
    Go to Dashboard
  </button>
</Link>
```

## Real-World Examples

### Hero Section CTA

```jsx
<div className="flex flex-col sm:flex-row gap-4">
  <button className="btn-glow-lg">
    Start Free Trial
    <ArrowRight className="w-5 h-5 ml-2" />
  </button>
  <button className="btn-glow-outline">
    Watch Demo
  </button>
</div>
```

### Feature Card

```jsx
<div className="feature-card">
  <h3>Premium Features</h3>
  <ul>
    <li>Real-time analytics</li>
    <li>AI-powered insights</li>
    <li>24/7 support</li>
  </ul>
  <button className="btn-glow w-full">
    <Rocket className="w-5 h-5 mr-2" />
    Get Started Now
  </button>
</div>
```

### Navigation Bar

```jsx
<nav>
  <div className="flex items-center gap-4">
    <Link href="/login">
      <button className="btn-glow-sm">Sign In</button>
    </Link>
    <Link href="/signup">
      <button className="btn-glow">
        Get Started Free
      </button>
    </Link>
  </div>
</nav>
```

## Technical Details

### Glow Effect Implementation

The impressive glow effect uses multiple layered `box-shadow` properties:

```css
/* Hover state shadows */
box-shadow:
  0 0 40px 8px rgba(125, 211, 252, 0.6),      /* Outer glow - wide spread */
  0 0 20px 4px rgba(125, 211, 252, 0.8),      /* Inner glow - intense */
  0 8px 32px 0 rgba(30, 64, 175, 0.5),        /* Drop shadow - depth */
  0 4px 8px 0 rgba(30, 64, 175, 0.3),         /* Close shadow - definition */
  inset 0 1px 0 0 rgba(255, 255, 255, 0.2),   /* Top highlight - dimension */
  0 0 0 3px rgba(125, 211, 252, 0.3);         /* Ring glow - emphasis */
```

### Transition Properties

```css
transition: all 300ms ease-out;
```

Smooth transitions for:
- Background color changes
- Shadow transformations
- Position translations
- Border color shifts

### Accessibility

- Full keyboard navigation support
- `:focus-visible` for keyboard users
- Maintains text contrast ratios
- Disabled state properly indicates non-interactivity
- Screen reader compatible

## Best Practices

1. **Use sparingly**: These buttons are high-impact. Reserve them for primary actions and CTAs.

2. **Pair with outline variant**: Use `.btn-glow` for primary actions and `.btn-glow-outline` for secondary actions.

3. **Consider context**: The glow effect works best on dark backgrounds. For light backgrounds, consider adjusting the opacity.

4. **Size appropriately**: Use larger sizes (`.btn-glow-lg`, `.btn-glow-xl`) for hero sections and important CTAs.

5. **Icon placement**: Place icons before text for actions (e.g., "🚀 Launch") or after for navigation (e.g., "Next →").

6. **Disabled state**: Always include proper handling for disabled buttons to prevent user confusion.

## Demo Page

Visit `/demo/neon-buttons` to see all variants in action with live examples and code snippets.

## Customization

All styles are defined in `app/globals.css` using Tailwind's `@layer components` directive. To customize:

1. Open `app/globals.css`
2. Find the `@layer components` section
3. Modify color values, shadow properties, or transitions
4. Rebuild your project

Example customization:

```css
@layer components {
  .btn-glow {
    /* Change base color */
    background-color: #your-color;

    /* Adjust shadow intensity */
    box-shadow: /* your shadows */;

    /* Modify transition speed */
    transition: all 400ms ease-in-out;
  }
}
```

## Browser Support

Works in all modern browsers that support:
- CSS `box-shadow` (all modern browsers)
- CSS `transition` (all modern browsers)
- Multiple shadows (all modern browsers)

## Performance

- Uses CSS only (no JavaScript)
- Hardware-accelerated transforms
- Optimized shadow rendering
- Minimal repaint/reflow
- Smooth 60fps animations

## Credits

Designed for Deep Tech interfaces with the color palette:
- Bright Cobalt (#1E40AF)
- Ice Blue (#7DD3FC)

Perfect for SaaS platforms, tech startups, AI products, and modern web applications.
