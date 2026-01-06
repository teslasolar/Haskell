/**
 * KONOMI Atomic Template System
 * One template, parameterized to any form
 * T(params) → button | label | link | input | block | ...
 */
const T = {
  // Atomic template - single source, multiple forms
  atom(p = {}) {
    const {
      as = 'span',        // element type
      text = '',          // inner content
      href = null,        // link target
      action = null,      // click handler name
      coord = null,       // block coordinate [x,y,z]
      css = '',           // additional classes
      data = {},          // data-* attributes
      children = [],      // nested templates
      bind = null,        // data binding key
      template = null,    // nested template ref
      params = {}         // template params
    } = p;

    const el = document.createElement(href ? 'a' : as);

    // Core content
    if (text) el.textContent = text;
    if (href) el.href = href;
    if (css) el.className = css;

    // Block coordinate linking
    if (coord && window.KONOMI) {
      const block = KONOMI.get(...coord);
      if (block) el.href = block.url;
      el.dataset.coord = coord.join(',');
    }

    // Data attributes
    Object.entries(data).forEach(([k,v]) => {
      el.dataset[k] = v;
    });

    // Action binding
    if (action && T.actions[action]) {
      el.onclick = (e) => T.actions[action](e, p);
    }

    // Nested children
    children.forEach(child => {
      el.appendChild(T.atom(child));
    });

    // Nested template expansion
    if (template && T.templates[template]) {
      const nested = T.templates[template](params);
      el.appendChild(T.atom(nested));
    }

    return el;
  },

  // Registered actions
  actions: {
    run: (e, p) => window.HASKELL?.run(p.data?.code),
    nav: (e, p) => window.location.href = p.href,
    copy: (e, p) => navigator.clipboard.writeText(p.text),
    log: (e, p) => console.log('T.action:', p)
  },

  // Reusable template definitions
  templates: {
    // Nav item - can be button, link, tab
    nav: (p) => ({
      as: 'a',
      text: p.label,
      href: p.to,
      css: 'nav-item',
      coord: p.coord
    }),

    // Code block with run action
    code: (p) => ({
      as: 'pre',
      text: p.src,
      css: 'code-block',
      data: { code: p.src, lang: p.lang || 'haskell' },
      children: p.runnable ? [{
        as: 'button',
        text: '▶ Run',
        css: 'run-btn',
        action: 'run',
        data: { code: p.src }
      }] : []
    }),

    // Block reference
    block: (p) => ({
      as: 'div',
      css: 'block-ref',
      coord: p.coord,
      text: `B[${p.coord.join('][')}]`
    }),

    // Layer section
    layer: (p) => ({
      as: 'section',
      css: 'layer',
      data: { layer: p.n },
      children: [
        { as: 'h2', text: `LAYER ${p.n}: ${p.title}` },
        { as: 'pre', text: p.content }
      ]
    }),

    // Grid of blocks
    grid: (p) => ({
      as: 'div',
      css: 'block-grid',
      children: p.items.map(item => ({
        template: 'block',
        params: { coord: item }
      }))
    })
  },

  // Render template by name
  render(name, params, target) {
    if (!T.templates[name]) return null;
    const spec = T.templates[name](params);
    const el = T.atom(spec);
    if (target) document.querySelector(target).appendChild(el);
    return el;
  },

  // Batch render
  renderAll(specs, target) {
    const container = document.querySelector(target);
    specs.forEach(s => container.appendChild(T.atom(s)));
  }
};

// Demo rendering
const demo = document.getElementById('demo');
demo.appendChild(T.atom({ as:'div', css:'demo-row', children: [
  { as:'span', text:'Label', css:'label' },
  { as:'button', text:'Button', css:'btn', action:'log' },
  { as:'a', text:'Link', href:'#', css:'link' },
  { as:'code', text:'Code', css:'code' }
]}));
demo.appendChild(T.render('code', {
  src: 'main = putStrLn "Hello"',
  runnable: true
}));

// Spec output
document.getElementById('spec').textContent = `T.atom(params) → Element

Params:
  as       : 'div'|'span'|'pre'|...
  text     : string
  href     : url (auto → <a>)
  action   : 'run'|'nav'|'copy'|'log'
  coord    : [x,y,z] block ref
  css      : class string
  data     : {key:val} → data-*
  children : [T.atom specs...]
  template : nested template name
  params   : template params

Templates:
  nav({label,to,coord})
  code({src,lang,runnable})
  block({coord})
  layer({n,title,content})
  grid({items:[[x,y,z],...]})`;

window.T = T;
