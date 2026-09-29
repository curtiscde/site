import React, { useRef } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CodeCopy } from './CodeCopy'
import { RESET_MS } from './useCodeCopy'
import { transformPost } from '../../types/Post'
import { ConsentContext } from '../../context/ConsentContext'

// Real renderer output, so these tests exercise the same markup contract the build emits.
const html = (markdown: string) =>
  transformPost({
    id: '1', title: 'T', slug: 's', date: new Date('2026-01-01T00:00:00'), tags: [], content: markdown,
  }).contentHtml

const threeBlocks = html(
  'Intro\n\n```js\nconst a = "<b>";\n```\n\n```bash\nnpm install\n```\n\n```\nplain\n```\n'
)

type Consent = 'undecided' | 'granted' | 'denied' | null

const Body = ({ content }: { content: string }) => {
  const container = useRef<HTMLDivElement>(null)
  return (
    <>
      <div ref={container} dangerouslySetInnerHTML={{ __html: content }} />
      <CodeCopy containerRef={container} />
    </>
  )
}

// As in the app, the consent provider sits above the article and a consent change
// re-renders only its consumers. Re-rendering the article itself would make React
// re-set its innerHTML — `{ __html }` is compared by identity — wiping the buttons.
const Article = ({ content, consent = null, body }: { content: string, consent?: Consent, body?: React.ReactElement }) => (
  <ConsentContext.Provider value={{ consent, grantConsent: () => {}, denyConsent: () => {} }}>
    {body ?? <Body content={content} />}
  </ConsentContext.Provider>
)

const buttons = () => Array.from(document.querySelectorAll<HTMLButtonElement>('.code-block__copy'))
const liveRegion = () => document.querySelector('[aria-live="polite"]')!

let writeText: jest.Mock

const setClipboard = (clipboard: unknown) =>
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true })

const click = async (target: Element) => {
  await act(async () => {
    fireEvent.click(target)
  })
}

beforeEach(() => {
  writeText = jest.fn().mockResolvedValue(undefined)
  setClipboard({ writeText })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('CodeCopy visibility', () => {
  it('reveals every copy button once the clipboard API is available', () => {
    render(<Article content={threeBlocks} />)

    expect(buttons()).toHaveLength(3)
    buttons().forEach(button => {
      expect(button).toBeVisible()
      expect(button).toHaveAttribute('data-state', 'idle')
    })
  })

  it('leaves the buttons hidden when there is no clipboard API', () => {
    setClipboard(undefined)
    render(<Article content={threeBlocks} />)

    buttons().forEach(button => expect(button).not.toBeVisible())
  })

  it('hides the buttons again when unmounted, since nothing would handle them', () => {
    const { unmount } = render(<Article content={threeBlocks} />)
    const found = buttons()
    unmount()

    found.forEach(button => expect(button).toHaveAttribute('hidden'))
  })

  it('renders exactly one live region for all blocks', () => {
    render(<Article content={threeBlocks} />)

    expect(document.querySelectorAll('[aria-live="polite"]')).toHaveLength(1)
  })
})

describe('CodeCopy copying', () => {
  it('copies the source of the block that was clicked, not its highlighted markup', async () => {
    render(<Article content={threeBlocks} />)

    await click(buttons()[0])

    expect(writeText).toHaveBeenCalledWith('const a = "<b>";')
  })

  it('copies the right block when there are several', async () => {
    render(<Article content={threeBlocks} />)

    await click(buttons()[1])

    expect(writeText).toHaveBeenCalledWith('npm install')
  })

  it('handles a click on the icon inside the button', async () => {
    render(<Article content={threeBlocks} />)

    await click(buttons()[1].querySelector('svg')!)

    expect(writeText).toHaveBeenCalledWith('npm install')
  })

  it('shows the copied state and announces it, then resets', async () => {
    jest.useFakeTimers()
    render(<Article content={threeBlocks} />)

    await click(buttons()[0])

    expect(buttons()[0]).toHaveAttribute('data-state', 'copied')
    expect(liveRegion()).toHaveTextContent('Copied')

    act(() => {
      jest.advanceTimersByTime(RESET_MS)
    })

    expect(buttons()[0]).toHaveAttribute('data-state', 'idle')
    expect(liveRegion()).toHaveTextContent('')
  })

  it('restarts the reset timer when the same button is clicked again', async () => {
    jest.useFakeTimers()
    render(<Article content={threeBlocks} />)

    await click(buttons()[0])
    act(() => {
      jest.advanceTimersByTime(RESET_MS - 500)
    })
    await click(buttons()[0])
    act(() => {
      jest.advanceTimersByTime(RESET_MS - 500)
    })

    expect(buttons()[0]).toHaveAttribute('data-state', 'copied')
  })

  it('shows a failed state when the browser refuses the write', async () => {
    writeText.mockRejectedValue(new Error('NotAllowedError'))
    render(<Article content={threeBlocks} />)

    await click(buttons()[0])

    expect(buttons()[0]).toHaveAttribute('data-state', 'failed')
    expect(liveRegion()).toHaveTextContent("Couldn't copy")
  })

  it('ignores clicks elsewhere in the article', async () => {
    render(<Article content={threeBlocks} />)

    await click(screen.getByText('Intro'))
    await click(document.querySelector('pre')!)

    expect(writeText).not.toHaveBeenCalled()
  })

  it('stops listening once unmounted', async () => {
    const { unmount } = render(<Article content={threeBlocks} />)
    const first = buttons()[0]
    unmount()

    await click(first)

    expect(writeText).not.toHaveBeenCalled()
  })
})

describe('CodeCopy tracking', () => {
  let gtag: jest.Mock

  beforeEach(() => {
    gtag = jest.fn()
    window.gtag = gtag
  })

  afterEach(() => {
    delete window.gtag
  })

  it('records a copy_code event with the language and block position', async () => {
    render(<Article content={threeBlocks} consent="granted" />)

    await click(buttons()[1])

    expect(gtag).toHaveBeenCalledTimes(1)
    expect(gtag).toHaveBeenCalledWith('event', 'copy_code', { language: 'bash', block_index: 1 })
  })

  it('reports a block with no language as "none"', async () => {
    render(<Article content={threeBlocks} consent="granted" />)

    await click(buttons()[2])

    expect(gtag).toHaveBeenCalledWith('event', 'copy_code', { language: 'none', block_index: 2 })
  })

  it.each<Consent>(['denied', 'undecided', null])('sends nothing when consent is %p', async consent => {
    render(<Article content={threeBlocks} consent={consent} />)

    await click(buttons()[0])

    expect(writeText).toHaveBeenCalled()
    expect(gtag).not.toHaveBeenCalled()
  })

  it('uses the consent in force at the time of the click', async () => {
    // Accepting the cookie banner after the page loads must count the next copy.
    // The same element both times, so only the consent consumer re-renders.
    const body = <Body content={threeBlocks} />
    const { rerender } = render(<Article content={threeBlocks} consent="undecided" body={body} />)
    rerender(<Article content={threeBlocks} consent="granted" body={body} />)

    await click(buttons()[0])

    expect(gtag).toHaveBeenCalledWith('event', 'copy_code', { language: 'js', block_index: 0 })
  })

  it('copies without error when consent is granted but GA has not loaded', async () => {
    delete window.gtag
    render(<Article content={threeBlocks} consent="granted" />)

    await click(buttons()[0])

    expect(buttons()[0]).toHaveAttribute('data-state', 'copied')
  })

  it('does not record a copy that failed', async () => {
    writeText.mockRejectedValue(new Error('NotAllowedError'))
    render(<Article content={threeBlocks} consent="granted" />)

    await click(buttons()[0])

    expect(gtag).not.toHaveBeenCalled()
  })
})
