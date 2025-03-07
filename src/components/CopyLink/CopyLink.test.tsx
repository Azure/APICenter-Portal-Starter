import React from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CopyLink } from './CopyLink';

let props: React.ComponentProps<typeof CopyLink>;
let wrapper: ReturnType<typeof render>;

beforeEach(() => {
  vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValueOnce(undefined);

  props = {
    url: 'https://microsoft.com',
    children: 'Copy',
  };
  wrapper = render(<CopyLink {...props} />);
});

test('should render correctly in default state', () => {
  expect(wrapper.baseElement).toMatchSnapshot();
});

describe('when user clicks on the link', () => {
  beforeEach(async () => {
    await userEvent.click(await wrapper.findByRole('link'));
  });

  test('should write url to clipboard', () => {
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(props.url);
  });

  test('should display a tooltip with copy confirmation', () => {
    expect(wrapper.baseElement).toMatchSnapshot();
  });

  test('should hide the tooltip after 2 seconds', async () => {
    vi.useFakeTimers();
    vi.advanceTimersToNextTimer();
    expect(wrapper.baseElement).toMatchSnapshot();
  });
});
