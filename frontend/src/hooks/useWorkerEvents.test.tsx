import React from 'react'
import { render, screen, act } from '@testing-library/react'
import useWorkerEvents from './useWorkerEvents'

// Simple component to surface hook state
function Consumer({ userId }: { userId?: string }) {
  const { lastEvent } = useWorkerEvents(userId)
  return <div data-testid="last">{lastEvent ? JSON.stringify(lastEvent) : 'null'}</div>
}

describe('useWorkerEvents', () => {
  let wsInstances: any[] = []

  // Mock global WebSocket
  beforeAll(() => {
    // @ts-ignore
    global.WebSocket = class {
      onopen: any = null
      onmessage: any = null
      onclose: any = null
      constructor(url: string) {
        // store instance so test can trigger events
        wsInstances.push(this)
      }
      send() {}
      close() {}
    }
  })

  afterEach(() => {
    wsInstances = []
  })

  it('receives and exposes events', async () => {
    render(<Consumer userId="u1" />)

    // simulate a message arriving
    await act(async () => {
      const inst = wsInstances[0]
      const msg = { event: 'PDF_READY', download_url: 'https://a' }
      inst.onmessage && inst.onmessage({ data: JSON.stringify(msg) })
    })

    expect(screen.getByTestId('last').textContent).toContain('PDF_READY')
  })
})
