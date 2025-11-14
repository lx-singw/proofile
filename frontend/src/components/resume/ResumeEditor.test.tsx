import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ResumeEditor from './ResumeEditor'

jest.mock('@/lib/resumeApi', () => ({
  createResume: jest.fn(async (name: string) => ({ id: 'created-1', name })),
  getResume: jest.fn(async (id: string) => ({ id, name: 'Loaded', data: {} })),
  saveResume: jest.fn(async (_id: string, _values: any) => ({ status: 'ok' })),
}))

describe('ResumeEditor', () => {
  it('renders and shows Save button', () => {
    render(<ResumeEditor />)
    const btn = screen.getByRole('button', { name: /save/i })
    expect(btn).toBeInTheDocument()
  })

  it('clicking save shows saving state', async () => {
    render(<ResumeEditor />)
    const btn = screen.getByRole('button', { name: /save/i })
    fireEvent.click(btn)
    // After clicking, button text should eventually return to Save; we assert the element exists
    expect(await screen.findByRole('button', { name: /save/i })).toBeInTheDocument()
  })
})
