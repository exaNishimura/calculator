import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';

interface RenderWithRouterOptions extends Omit<MemoryRouterProps, 'children'> {
  route?: string;
  renderOptions?: RenderOptions;
}

export function renderWithRouter(
  ui: ReactElement,
  { route = '/', renderOptions, ...routerProps }: RenderWithRouterOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]} {...routerProps}>
        {children}
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
