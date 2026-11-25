import { formatEuro, getEstimate } from './pricing.js'

const houseIcon = '<svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M3.5 12.5 18 6l10 4v14l-14.5 3-10-4zM3.5 12.5l10 4L28 10M13.5 16.5V27m4.5-1v-7l5-1v7" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round"/></svg>'
const checkIcon = '<svg width="27" height="27" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4.5 12 5 5 10-11" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const closeIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
const materialNames = { wood: 'lemn', metal: 'metal', fiber: 'fibrociment' }
const dimensions = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 })

function formatDetails(config) {
  if (config.model === 'x7') return 'Aluminiu · geam panoramic · 2 aparate de aer condiționat. Nuanțele și finisajele din simulare se confirmă în oferta finală.'
  const materials = [...new Set(Object.values(config.walls).map(wall => materialNames[wall.material]).filter(Boolean))]
  const roof = config.roof.style === 'gable' ? 'în două ape' : 'într-o apă'
  return [materials.length && 'Fațadă din ' + materials.join(' și '), 'acoperiș ' + roof].filter(Boolean).join(' · ')
}

export function mountQuote({ getConfig, getModel, opener }) {
  const dialog = document.createElement('dialog')
  dialog.className = 'mq-dialog'
  dialog.setAttribute('aria-labelledby', 'mq-title')
  dialog.innerHTML = `
    <button type="button" class="mq-close" aria-label="Închide formularul">${closeIcon}</button>
    <section class="mq-form-view">
      <h2 class="mq-heading" id="mq-title" tabindex="-1">Solicită o ofertă</h2>
      <p class="mq-intro">Completează datele de contact pentru configurația ta.</p>
      <div class="mq-project">
        <div class="mq-design">
          <span class="mq-house">${houseIcon}</span>
          <div><strong class="mq-model"></strong><span class="mq-size"></span></div>
        </div>
        <p class="mq-details"></p>
        <div class="mq-price"><span>Preț estimat</span><span><strong class="mq-total"></strong> <small>+ TVA</small></span></div>
      </div>
      <details class="mq-breakdown">
        <summary>Detaliile prețului</summary>
        <dl class="mq-lines"></dl>
      </details>
      <p class="mq-delivery">Transportul, macaraua și montajul se calculează separat.</p>
      <form class="mq-form">
        <label class="mq-wide">Nume complet<input name="name" type="text" minlength="2" maxlength="100" autocomplete="name" required></label>
        <label class="mq-wide">Adresă de e-mail<input name="email" type="email" maxlength="254" autocomplete="email" required></label>
        <label class="mq-wide"><span>Telefon <small>(opțional)</small></span><input name="phone" type="tel" maxlength="32" autocomplete="tel"></label>
        <label><span>Localitate <small>(opțional)</small></span><input name="locality" type="text" maxlength="120" autocomplete="address-level2"></label>
        <label>Cod poștal<input name="postalCode" type="text" minlength="2" maxlength="16" autocomplete="postal-code" required></label>
        <p class="mq-error mq-wide" role="alert" hidden></p>
        <button type="submit" class="mq-submit mq-wide">Trimite cererea</button>
        <span class="mq-sr" aria-live="polite"></span>
      </form>
    </section>
    <section class="mq-success" hidden>
      <div class="mq-tick">${checkIcon}</div>
      <h2 class="mq-heading" id="mq-received" tabindex="-1">Cererea a fost înregistrată</h2>
      <p class="mq-intro">Am salvat datele tale și configurația aleasă.</p>
      <div class="mq-reference"><span>Număr de referință</span><strong></strong></div>
      <p class="mq-saved-price"></p>
      <button type="button" class="mq-done">Închide</button>
    </section>`
  document.body.append(dialog)

  const select = selector => dialog.querySelector(selector)
  const form = select('.mq-form')
  const submitButton = select('.mq-submit')
  const error = select('.mq-error')
  const formView = select('.mq-form-view')
  const successView = select('.mq-success')
  const fields = [...form.querySelectorAll('input')]
  const attempts = new Map()
  let config
  let displayedKey = null
  let returnFocus

  function setBusy(busy) {
    form.setAttribute('aria-busy', String(busy))
    for (const field of fields) field.readOnly = busy
    submitButton.disabled = busy
    submitButton.textContent = busy ? 'Se trimite…' : 'Trimite cererea'
    select('.mq-sr').textContent = busy ? 'Se trimite cererea de ofertă.' : ''
  }

  function renderEstimate(estimate) {
    select('.mq-total').textContent = formatEuro(estimate.total)
    const breakdown = select('.mq-breakdown')
    breakdown.open = false
    const rows = document.createDocumentFragment()
    for (const line of [{ label: 'Preț de bază', amount: estimate.base }, ...estimate.lines]) {
      const label = document.createElement('dt')
      label.textContent = line.label
      const amount = document.createElement('dd')
      amount.textContent = formatEuro(line.amount)
      rows.append(label, amount)
    }
    select('.mq-lines').replaceChildren(rows)
    select('.mq-saved-price').textContent = `Configurația înregistrată are un preț estimat de ${formatEuro(estimate.total)} + TVA.`
  }

  function showSuccess(reference,estimatedTotal) {
    if(Number.isFinite(estimatedTotal)) select('.mq-saved-price').textContent='Configurația înregistrată are un preț estimat de '+formatEuro(estimatedTotal)+' + TVA.';
    formView.hidden = true
    successView.hidden = false
    select('.mq-reference strong').textContent = reference
    dialog.setAttribute('aria-labelledby', 'mq-received')
    select('#mq-received').focus({ preventScroll: true })
  }

  function valueOf(field) {
    return form.elements.namedItem(field).value.trim()
  }

  function payload() {
    return {
      config,
      name: valueOf('name'),
      email: valueOf('email'),
      phone: valueOf('phone'),
      locality: valueOf('locality'),
      postalCode: valueOf('postalCode')
    }
  }

  function open() {
    if (dialog.open) return
    const source = typeof opener === 'function' ? opener() : opener
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : source
    config = structuredClone(getConfig())
    const model = getModel()
    select('.mq-model').textContent = model.name
    select('.mq-size').textContent = `${dimensions.format(model.length)} × ${dimensions.format(model.width)} m · ${dimensions.format(model.area)} m²`
    select('.mq-details').textContent = formatDetails(config)
    renderEstimate(getEstimate(config))
    dialog.setAttribute('aria-labelledby', 'mq-title')
    successView.hidden = true
    formView.hidden = false
    error.hidden = true
    dialog.showModal()
    dialog.scrollTop = 0
    const key = JSON.stringify(payload())
    const attempt = attempts.get(key)
    displayedKey = attempt?.pending ? key : null
    setBusy(Boolean(attempt?.pending))
    if (attempt?.reference && !attempt.acknowledged) {
      showSuccess(attempt.reference,attempt.estimatedTotal)
      displayedKey = key
    } else {
      select('#mq-title').focus({ preventScroll: true })
    }
  }

  function close() {
    if (dialog.open) dialog.close()
  }

  dialog.addEventListener('close', () => {
    if (!successView.hidden) {
      const attempt = attempts.get(displayedKey)
      if (attempt) attempt.acknowledged = true
    }
    if (returnFocus?.isConnected && returnFocus !== document.body) {
      returnFocus.focus({ preventScroll: true })
    }
    displayedKey = null
  })
  select('.mq-close').addEventListener('click', close)
  select('.mq-done').addEventListener('click', close)
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return
    const { left, right, top, bottom } = dialog.getBoundingClientRect()
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) close()
  })
  for (const field of fields) {
    field.addEventListener('input', () => {
      field.setCustomValidity('')
      error.hidden = true
    })
  }

  form.addEventListener('submit', async event => {
    event.preventDefault()
    const body = payload()
    if (body.name.length < 2) form.elements.name.setCustomValidity('Completează numele, folosind cel puțin două caractere.')
    if (body.postalCode.length < 2 || !/^[\p{L}\p{N}][\p{L}\p{N} -]*$/u.test(body.postalCode)) {
      form.elements.postalCode.setCustomValidity('Introdu un cod poștal valid, folosind litere, cifre, spații sau cratime.')
    }
    if (!form.reportValidity()) return
    const key = JSON.stringify(body)
    let attempt = attempts.get(key)
    if (attempt?.pending) return
    displayedKey = key
    if (attempt?.reference) {
      showSuccess(attempt.reference,attempt.estimatedTotal)
      return
    }
    if (!attempt) {
      attempt = { requestId: crypto.randomUUID(), pending: false }
      attempts.set(key, attempt)
    }
    attempt.pending = true
    error.hidden = true
    setBusy(true)
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ ...body, requestId: attempt.requestId }),
        signal: AbortSignal.timeout(25000)
      })
      if (!response.ok) {
        const message = response.status === 400 || response.status === 422
          ? 'Verifică datele completate și retrimite cererea.'
          : 'Cererea nu a putut fi confirmată. Poți încerca din nou.'
        throw new Error(message)
      }
      const data = await response.json()
      if (typeof data.reference !== 'string' || !data.reference) throw new Error()
      attempt.estimatedTotal = data.estimatedTotal
      attempt.reference = data.reference
      if (dialog.open && displayedKey === key) showSuccess(data.reference,data.estimatedTotal)
    } catch (failure) {
      if (dialog.open && displayedKey === key) {
        error.textContent = failure.message.startsWith('Verifică') || failure.message.startsWith('Cererea')
          ? failure.message : 'Verifică conexiunea și încearcă din nou. Datele completate sunt păstrate.'
        error.hidden = false
      }
    } finally {
      attempt.pending = false
      if (dialog.open && displayedKey === key) setBusy(false)
    }
  })

  return { open, close }
}
