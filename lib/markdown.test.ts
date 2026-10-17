import { describe, expect, it } from 'vitest';
import { markdownToHtml } from './markdown';

describe('markdownToHtml', () => {
  it('renders headings, lists and bold text', () => {
    const html = markdownToHtml('# NEP 2020\n\n- **Released:** 29 July 2020\n- Replaces 1986 policy\n\n1. First\n2. Second');
    expect(html).toContain('<h2>NEP 2020</h2>');
    expect(html).toContain('<ul><li><strong>Released:</strong> 29 July 2020</li><li>Replaces 1986 policy</li></ul>');
    expect(html).toContain('<ol><li>First</li><li>Second</li></ol>');
  });

  it('renders pipe tables', () => {
    const html = markdownToHtml('| Term | Meaning |\n|---|---|\n| URL | Uniform Resource Locator |');
    expect(html).toContain('<th>Term</th>');
    expect(html).toContain('<td>Uniform Resource Locator</td>');
  });

  it('escapes raw HTML so notes cannot inject markup', () => {
    expect(markdownToHtml('<script>alert(1)</script>')).not.toContain('<script>');
  });
});
