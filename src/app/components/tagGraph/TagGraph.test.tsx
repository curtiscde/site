import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { GraphLink, GraphNode } from '../../util/graph'

// d3-force is ESM-only; jest doesn't transform node_modules. The component's
// physics isn't under test here (canvas + RAF are stubbed), so mock the module
// with chainable no-ops that mirror the fluent d3-force API.
jest.mock('d3-force', () => {
  const chain = (): Record<string, unknown> => new Proxy({}, { get: () => () => chain() })
  const simulation = {
    force: () => simulation,
    velocityDecay: () => simulation,
    alpha: () => 1,
    alphaTarget: () => simulation,
    restart: () => simulation,
    stop: () => simulation,
  }
  return {
    forceSimulation: () => simulation,
    forceManyBody: () => chain(),
    forceLink: () => chain(),
    forceCenter: () => chain(),
    forceCollide: () => chain(),
  }
})

import { TagGraph } from './TagGraph'

// jsdom provides no canvas 2D context, no ResizeObserver, and no RAF loop —
// stub them so the client effect can mount without a real renderer.
const ctxStub = {
  setTransform: jest.fn(),
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  fillText: jest.fn(),
} as unknown as CanvasRenderingContext2D

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ctxStub) as unknown as typeof HTMLCanvasElement.prototype.getContext
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  // RAF that does not re-schedule, so the draw loop runs at most once.
  window.requestAnimationFrame = jest.fn(() => 1) as unknown as typeof window.requestAnimationFrame
  window.cancelAnimationFrame = jest.fn()
})

const nodes: GraphNode[] = [
  { id: 'tag:react', kind: 'tag', label: 'react', count: 2, radius: 10, href: '/tag/react' },
  { id: 'post:a', kind: 'post', label: 'Post A', radius: 4.5, href: '/post/a', tags: ['react'] },
]
const links: GraphLink[] = [{ source: 'post:a', target: 'tag:react' }]

describe('TagGraph', () => {
  it('renders the search input', () => {
    render(<TagGraph nodes={nodes} links={links} />)
    expect(screen.getByRole('textbox', { name: 'Search tags' })).toBeInTheDocument()
  })

  it('renders the legend', () => {
    render(<TagGraph nodes={nodes} links={links} />)
    expect(screen.getByText('Tag')).toBeInTheDocument()
    expect(screen.getByText('Post')).toBeInTheDocument()
    expect(screen.getByText('node size = post count')).toBeInTheDocument()
  })

  it('renders the zoom and reset controls', () => {
    render(<TagGraph nodes={nodes} links={links} />)
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset view' })).toBeInTheDocument()
  })

  it('hides the detail panel until a node is selected', () => {
    render(<TagGraph nodes={nodes} links={links} />)
    expect(screen.queryByRole('button', { name: 'Close details' })).toBeNull()
  })

  it('acquires a 2D context for the canvas', () => {
    render(<TagGraph nodes={nodes} links={links} />)
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d')
  })
})
