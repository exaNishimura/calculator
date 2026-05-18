import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AmountDisplay } from './AmountDisplay';
import { Badge } from './Badge';
import { Card } from './Card';
import { GameButton } from './GameButton';
import { WarningAlert } from './WarningAlert';
import { UiShowcase } from './UiShowcase';

describe('AmountDisplay', () => {
  it('renders large formatted amount with P suffix', () => {
    render(<AmountDisplay amount={50000} />);
    const el = screen.getByTestId('amount-display');
    expect(el).toHaveTextContent('50,000');
    expect(el).toHaveTextContent('P');
    expect(el.className).toMatch(/text-4xl|text-5xl/);
  });

  it('applies profit tone', () => {
    render(<AmountDisplay amount={1000} tone="profit" label="利益" />);
    expect(screen.getByTestId('amount-display')).toHaveClass('text-game-profit');
  });

  it('applies loss tone', () => {
    render(<AmountDisplay amount={-5000} tone="loss" />);
    expect(screen.getByTestId('amount-display')).toHaveClass('text-game-loss');
  });

  it('applies warning tone for debt display', () => {
    render(<AmountDisplay amount={100000} tone="warning" label="借入総額" />);
    expect(screen.getByTestId('amount-display')).toHaveClass('text-game-warning');
  });
});

describe('GameButton', () => {
  it('renders large tappable button', () => {
    render(<GameButton>投資完了</GameButton>);
    const btn = screen.getByRole('button', { name: '投資完了' });
    expect(btn.className).toMatch(/min-h-/);
    expect(btn.className).toMatch(/text-lg|text-xl/);
  });

  it('calls onClick when enabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<GameButton onClick={onClick}>次へ</GameButton>);
    await user.click(screen.getByRole('button', { name: '次へ' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <GameButton disabled onClick={onClick}>
        無効
      </GameButton>,
    );
    await user.click(screen.getByRole('button', { name: '無効' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Card', () => {
  it('renders children in card surface', () => {
    render(<Card>カード内容</Card>);
    const card = screen.getByTestId('game-card');
    expect(card).toHaveTextContent('カード内容');
    expect(card.className).toMatch(/bg-game-surface/);
    expect(card.className).toMatch(/rounded/);
  });
});

describe('Badge', () => {
  it('renders profit badge in green', () => {
    render(<Badge tone="profit">+80%</Badge>);
    expect(screen.getByText('+80%')).toHaveClass('text-game-profit');
  });

  it('renders loss badge in red', () => {
    render(<Badge tone="loss">-20%</Badge>);
    expect(screen.getByText('-20%')).toHaveClass('text-game-loss');
  });
});

describe('WarningAlert', () => {
  it('renders borrow warning with yellow styling', () => {
    render(<WarningAlert>借入中です</WarningAlert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('借入中です');
    expect(alert.className).toMatch(/border-game-warning|bg-game-warning/);
  });
});

describe('UiShowcase', () => {
  it('renders all primitive categories for visual verification', () => {
    render(<UiShowcase />);
    expect(screen.getByTestId('ui-showcase')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '投資完了' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getAllByTestId('game-card').length).toBeGreaterThanOrEqual(1);
  });
});
