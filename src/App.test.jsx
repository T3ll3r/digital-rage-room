import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ACTIONS, MEMES, TARGETS } from './data'

function createImageSearch() {
  let request = 0
  return vi.fn(async (subject) => {
    request += 1
    return {
      src: `https://api.memegen.link/images/test-${encodeURIComponent(subject)}-${request}.jpg`,
      kind: `${subject} meme`,
      credit: 'Test Meme · Memegen.link',
      pageUrl: 'https://memegen.link/',
    }
  })
}

function renderApp(props = {}) {
  const searchImage = props.searchImage ?? createImageSearch()
  return { searchImage, ...render(<App {...props} searchImage={searchImage} />) }
}

describe('Digital Rage Room', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })
  it('offers a large and varied target gallery with roughly twenty rage per reaction', () => {
    expect(TARGETS.length).toBeGreaterThanOrEqual(15)
    expect(new Set(TARGETS.map((target) => target.kind)).size).toBeGreaterThanOrEqual(10)
    expect(MEMES).toHaveLength(111)
    expect(new Set(MEMES).size).toBe(111)
    expect(ACTIONS.every((action) => action.points >= 18 && action.points <= 22)).toBe(true)
  })

  it('presents an unofficial Army field edition with a rotating meme', () => {
    renderApp()

    expect(screen.getByText(/army field edition/i)).toBeInTheDocument()
    expect(screen.getByTestId('army-meme')).toHaveTextContent(/printer|toner|scanner/i)
    expect(screen.getByText(/not affiliated with the department of defense/i)).toBeInTheDocument()
  })

  it('loads a frustration and makes it the active target', async () => {
    const user = userEvent.setup()
    const { searchImage } = renderApp()

    const input = screen.getByLabelText(/what broke your spirit/i)
    await user.clear(input)
    await user.type(input, 'Friday deploys')

    expect(screen.getByTestId('root-cause')).toHaveTextContent('FRIDAY DEPLOYS')

    await user.click(screen.getByRole('button', { name: /acquire target/i }))

    expect(searchImage).toHaveBeenCalledWith('Friday deploys')
    expect(screen.getByText(/friday deploys/i, { selector: '#target-label strong' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /friday deploys/i })).toBeInTheDocument()
    expect(screen.getByTestId('army-meme')).toHaveTextContent(/deploy|build|prod|patch|friday/i)
    expect(screen.getByText(/memegen\.link/i)).toHaveAttribute('href', 'https://memegen.link/')
  })

  it('reacts to a target and increases the rage meter', async () => {
    const user = userEvent.setup()
    renderApp()

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '12')
    await user.click(screen.getByRole('button', { name: /rage burn/i }))

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '32')
    expect(screen.getByRole('status')).toHaveTextContent(/incineration protocol/i)
    expect(screen.getByTestId('target-stage')).toHaveAttribute('data-effect', 'burn')
  })

  it('triggers a nuclear explosion at maximum rage and resets the meter', async () => {
    vi.useFakeTimers()
    renderApp()

    const rageButton = screen.getByRole('button', { name: /rage burn/i })
    const originalImage = screen.getByRole('img', { name: /printer errors/i }).getAttribute('src')
    fireEvent.click(rageButton)
    fireEvent.click(rageButton)
    fireEvent.click(rageButton)
    fireEvent.click(rageButton)
    fireEvent.click(rageButton)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByTestId('target-stage')).toHaveAttribute('data-effect', 'nuke')
    expect(screen.getByRole('status')).toHaveTextContent(/maximum rage/i)

    await act(async () => vi.advanceTimersByTime(1800))

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByTestId('target-stage')).toHaveAttribute('data-effect', 'idle')
    expect(screen.getByRole('img', { name: /printer errors/i })).not.toHaveAttribute('src', originalImage)
  })

  it('cycles targets and supports sound and reduced-motion controls', async () => {
    const user = userEvent.setup()
    renderApp()

    const firstImage = screen.getByRole('img', { name: /printer errors/i })
    const firstSrc = firstImage.getAttribute('src')
    await user.click(screen.getByRole('button', { name: /next internet target/i }))
    await waitFor(() => expect(screen.getByRole('img', { name: /printer errors/i })).not.toHaveAttribute('src', firstSrc))

    await user.click(screen.getByRole('button', { name: /sound effects/i }))
    expect(screen.getByRole('button', { name: /sound effects/i })).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: /reduced motion/i }))
    expect(screen.getByRole('button', { name: /reduced motion/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('app-shell')).toHaveClass('reduce-motion')
  })

  it('shows a different reserve image and the failure reason when internet search fails', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const searchImage = vi.fn().mockRejectedValue(new Error('Commons returned no usable images.'))
    const user = userEvent.setup()
    renderApp({ searchImage })
    const originalSrc = screen.getByRole('img', { name: /printer errors/i }).getAttribute('src')

    await user.click(screen.getByRole('button', { name: /next internet target/i }))

    await waitFor(() => expect(screen.getByRole('img', { name: /printer errors/i })).not.toHaveAttribute('src', originalSrc))
    expect(screen.getByRole('status')).toHaveTextContent(/commons returned no usable images/i)
  })
})
