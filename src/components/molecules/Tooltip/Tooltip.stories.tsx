import type { Meta, StoryObj } from '@storybook/react'
import { Tooltip } from './Tooltip'

const trigger = (
  <button type="button" style={{ padding: '8px 16px' }}>
    Hover me
  </button>
)

const meta: Meta<typeof Tooltip> = {
  title: 'Molecules/Tooltip',
  component: Tooltip,
  argTypes: {
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
  },
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  args: {
    content: 'Tooltip on top',
    placement: 'top',
    children: trigger,
  },
}

export const Bottom: Story = {
  args: {
    content: 'Tooltip on bottom',
    placement: 'bottom',
    children: trigger,
  },
}

export const Left: Story = {
  args: {
    content: 'Tooltip on left',
    placement: 'left',
    children: trigger,
  },
}

export const Right: Story = {
  args: {
    content: 'Tooltip on right',
    placement: 'right',
    children: trigger,
  },
}

export const AllPlacements: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-16)',
        padding: 'var(--space-12)',
        placeItems: 'center',
        minHeight: '280px',
      }}
    >
      <Tooltip content="Top placement" placement="top">
        <button type="button" style={{ padding: '8px 16px' }}>
          Hover me
        </button>
      </Tooltip>
      <Tooltip content="Bottom placement" placement="bottom">
        <button type="button" style={{ padding: '8px 16px' }}>
          Hover me
        </button>
      </Tooltip>
      <Tooltip content="Left placement" placement="left">
        <button type="button" style={{ padding: '8px 16px' }}>
          Hover me
        </button>
      </Tooltip>
      <Tooltip content="Right placement" placement="right">
        <button type="button" style={{ padding: '8px 16px' }}>
          Hover me
        </button>
      </Tooltip>
    </div>
  ),
}
