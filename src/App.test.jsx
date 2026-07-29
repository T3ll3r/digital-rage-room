import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ACTIONS, MEMES, TARGETS } from './data'

describe('Digital Rage Room', () => {
  afterEach(() => vi.useRealTimers())
  it('offers a large and varied target gallery with roughly twenty rage per reaction', () => {
    expect(TARGETS.length).toBeGreaterThanOrEqual(15)
    expect(new Set(TARGETS.map((target) => target.kind)).size).toBeGreaterThanOrEqual(10)
    expect(MEMES.length).toBeGreaterThanOrEqual(8)
    expect(ACTIONS.every((action) => action.points >= 18 && action.points <= 22)).toBe(true)
  })

  it('presents an unofficial Army field edition with a rotating meme', () => {
    render(<App />)

    expect(screen.getByText(/army field edition/i)).toBeInTheDocument()
    expect(screen.getByTestId('army-meme')).toHaveTextContent(MEMES[0])
    expect(screen.getByText(/not affiliated with the department of defense/i)).toBeInTheDocument()
  })

  it('loads a frustration and makes it the active target', async () => {
    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByLabelText(/what broke your spirit/i)
    await user.clear(input)
    await user.type(input, 'Friday deploys')
    await user.click(screen.getByRole('button', { name: /acquire target/i }))

    expect(screen.getByText(/friday deploys/i, { selector: '#target-label strong' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /friday deploys/i })).toBeInTheDocument()
  })

  it('reacts to a target and increases the rage meter', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '12')
    await user.click(screen.getByRole('button', { name: /rage burn/i }))

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '32')
    expect(screen.getByRole('status')).toHaveTextContent(/incineration protocol/i)
    expect(screen.getByTestId('target-stage')).toHaveAttribute('data-effect', 'burn')
  })

  it('triggers a nuclear explosion at maximum rage and resets the meter', () => {
    vi.useFakeTimers()
    render(<App />)

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

    act(() => vi.advanceTimersByTime(1800))

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByTestId('target-stage')).toHaveAttribute('data-effect', 'idle')
    expect(screen.getByRole('img', { name: /printer errors/i })).not.toHaveAttribute('src', originalImage)
  })

  it('cycles targets and supports sound and reduced-motion controls', async () => {
    const user = userEvent.setup()
    render(<App />)

    const firstImage = screen.getByRole('img', { name: /printer errors/i })
    const firstSrc = firstImage.getAttribute('src')
    await user.click(screen.getByRole('button', { name: /next innocent target/i }))
    expect(screen.getByRole('img', { name: /printer errors/i })).not.toHaveAttribute('src', firstSrc)

    await user.click(screen.getByRole('button', { name: /sound effects/i }))
    expect(screen.getByRole('button', { name: /sound effects/i })).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: /reduced motion/i }))
    expect(screen.getByRole('button', { name: /reduced motion/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('app-shell')).toHaveClass('reduce-motion')
  })
})
