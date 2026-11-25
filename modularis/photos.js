export const shots = [
  {
    file: 'exterior-evening',
    label: 'Exterior, seara',
    detail: 'Finisaj standard · fotografie reală',
    alt: 'Capsula X7 albă, cu ferestre panoramice și benzi de lumină aprinse seara.'
  },
  {
    file: 'living-wide',
    label: 'Living panoramic',
    detail: 'Interior fotografiat · mobilier opțional',
    alt: 'Livingul capsulei X7 în lumină naturală, cu ferestre panoramice, masă și fotolii.'
  },
  {
    file: 'bedroom-daylight',
    label: 'Dormitor',
    detail: 'Interior fotografiat · mobilier opțional',
    alt: 'Dormitorul capsulei X7 cu lumină naturală, geamuri mari și perdele.'
  },
  {
    file: 'bathroom',
    label: 'Baie',
    detail: 'Finisaj standard · fotografie reală',
    alt: 'Baia capsulei X7 cu lavoar, oglindă și cabină de duș.'
  }
]
const asset = filename => new URL('./assets/' + filename + '.webp', import.meta.url).href
const photoIcon = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 18 5-5 3 3 4-6 5 6"/></svg>'
const cubeIcon = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="m12 2.5 8.5 5v9l-8.5 5-8.5-5v-9zM3.5 7.5l8.5 5 8.5-5M12 12.5v9"/></svg>'

export function mountPhotos(stage, { onModeChange } = {}) {
  const viewport = stage.querySelector('.viewport')
  const bottom = stage.querySelector('.stage-bottom')
  const resources = bottom.querySelector('.scene-resources')
  let model = null
  let mode = '3d'
  let index = 0

  const surface = document.createElement('figure')
  surface.id = 'x7-photo-surface'
  surface.className = 'x7-photo-surface'
  surface.hidden = true
  const image = document.createElement('img')
  image.className = 'x7-main-image'
  image.fetchPriority = 'high'
  image.draggable = false
  surface.append(image)
  stage.insertBefore(surface, viewport)

  const controls = document.createElement('div')
  controls.className = 'x7-mode'
  controls.setAttribute('role', 'group')
  controls.setAttribute('aria-label', 'Mod de vizualizare X7')
  controls.innerHTML = `<button type="button" data-x7-mode="photo" aria-controls="x7-photo-surface">${photoIcon}<span>Fotografii</span></button><button type="button" data-x7-mode="3d" aria-controls="viewer">${cubeIcon}<span>Model 3D</span></button>`
  resources.prepend(controls)
  controls.hidden = true

  const rail = document.createElement('div')
  rail.className = 'x7-photo-rail'
  rail.hidden = true
  const caption = document.createElement('div')
  caption.className = 'x7-photo-caption'
  caption.setAttribute('aria-live', 'polite')
  caption.innerHTML = '<span></span><strong></strong>'
  const strip = document.createElement('div')
  strip.className = 'x7-filmstrip'
  strip.setAttribute('role', 'group')
  strip.setAttribute('aria-label', 'Fotografii ale capsulei X7')
  const thumbs = shots.map((photo, n) => {
    const button = document.createElement('button')
    button.className = 'x7-thumb'
    button.type = 'button'
    button.setAttribute('aria-label', 'Vezi fotografia „' + photo.label + '”')
    button.title = photo.label
    const mini = document.createElement('img')
    mini.src = asset('thumb-' + photo.file)
    mini.alt = ''
    mini.width = 148
    mini.height = 96
    mini.draggable = false
    button.append(mini)
    button.addEventListener('click', () => show(n))
    button.addEventListener('keydown', event => {
      const key = event.key
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return
      event.preventDefault()
      const target = key === 'Home' ? 0 : key === 'End' ? shots.length - 1
        : (index + (key === 'ArrowRight' ? 1 : -1) + shots.length) % shots.length
      show(target)
      thumbs[target].focus({ preventScroll: true })
    })
    strip.append(button)
    return button
  })
  rail.append(caption, strip)
  bottom.prepend(rail)

  function show(next) {
    index = next
    const shot = shots[index]
    const url = asset(shot.file)
    image.alt = shot.alt
    if (image.src !== url) image.src = url
    surface.dataset.photo = shot.file
    surface.style.setProperty('--x7-image', `url("${url}")`)
    caption.querySelector('strong').textContent = shot.label
    caption.querySelector('span').textContent = shot.detail
    for (const [n, button] of thumbs.entries()) {
      button.setAttribute('aria-pressed', String(n === index))
    }
  }

  function setMode(next) {
    const chosen = next === 'photo' && model === 'x7' ? 'photo' : '3d'
    const changed = chosen !== mode
    mode = chosen
    const photograph = mode === 'photo'
    stage.dataset.sceneMode = chosen
    surface.hidden = !photograph
    rail.hidden = !photograph
    viewport.inert = photograph
    if (photograph) {
      viewport.setAttribute('aria-hidden', 'true')
      show(index)
    } else {
      viewport.removeAttribute('aria-hidden')
    }
    for (const button of controls.querySelectorAll('[data-x7-mode]')) {
      button.setAttribute('aria-pressed', String(button.dataset.x7Mode === chosen))
    }
    if (changed) onModeChange?.(mode)
  }

  for (const button of controls.querySelectorAll('[data-x7-mode]')) {
    button.addEventListener('click', () => setMode(button.dataset.x7Mode))
  }
  let start
  surface.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.pointerType === 'mouse') return
    start = { x: event.clientX, y: event.clientY }
  })
  surface.addEventListener('pointercancel', () => { start = null })
  surface.addEventListener('pointerup', event => {
    if (!start || !event.isPrimary) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    start = null
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      show((index + (dx < 0 ? 1 : -1) + shots.length) % shots.length)
    }
  })

  function setModel(modelId) {
    if (model === modelId) return
    model = modelId
    controls.hidden = model !== 'x7'
    stage.dataset.photoAvailable = String(model === 'x7')
    if (model === 'x7') index = 0
    setMode(model === 'x7' ? 'photo' : '3d')
  }

  function getPhoto() {
    if (mode !== 'photo') return null
    const shot = shots[index]
    return { src: asset(shot.file), filename: 'Capsula-X7-' + shot.file + '.webp', alt: shot.alt }
  }

  return { setModel, setMode, getMode: () => mode, getPhoto }
}
