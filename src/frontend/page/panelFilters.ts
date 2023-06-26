import * as packets from "../packets"
import { querySelector, htmlText, htmlElement } from "../..//lib"

function fieldAutocomplete() {
  querySelector('#field_wrapper').innerHTML = '<div id="field_placeholder"></div>';

  // @ts-ignore
  accessibleAutocomplete({
    id: 'field',
    element: querySelector('#field_placeholder'),
    source: (query: string, callback: (results: string[]) => void) => {
      const results: string[] = [];
      const terms = query.split(' ');
      for (const field of window.VIEW.getFields()) {
        if (terms.every(t=> field.indexOf(t) !== -1)) {
          results.push(field);
          if (results.length === window.OPTIONS.searchResults) break;
        }
      }
      callback(results);
    },
    // autoselect: true,
    displayMenu: 'overlay',
    placeholder: 'Field',
    showAllValues: true,
  });
}

querySelector('#filter_form').addEventListener('submit', e=> {
  e.preventDefault();
  const field = querySelector<HTMLInputElement>('#field');
  if ((e.submitter as HTMLButtonElement).value === 'Group By') {
    window.VIEW.addGroup(field.value);
  } else {
    const filter = querySelector<HTMLSelectElement>('#filter');
    const value = querySelector<HTMLInputElement>('#value');
    window.VIEW.addFilter(field.value, filter.value, value.value);
  }
  resetFilterForm();
});

function resetFilterForm() {
  const filter = querySelector<HTMLSelectElement>('#filter');
  filter.value = (filter.children[0] as HTMLOptionElement).value;
  querySelector<HTMLInputElement>('#value').value = '';
  fieldAutocomplete();
  rebuildFilterList();
}

function createFilterListItem(ul: HTMLUListElement, field: string) {
  const li = htmlElement('li', {}, 
    htmlElement('span', {innerText: field, classList: ['isfield']}),
    htmlText(' '),
  );
  ul.appendChild(li);
  return li;
}

export function rebuildFilterList() {
  const ul = querySelector<HTMLUListElement>('#active_filters') as HTMLUListElement;
  Array.from(ul.childNodes).forEach(n => ul.removeChild(n));
  for (const [param, item] of window.VIEW.getFilterItems()) {
    if (item.isGroup()) {
      const li = createFilterListItem(ul, param);

      li.prepend(
        htmlElement('span', { innerText: 'GROUP BY', classList: ['isFilter'] }),
        htmlText(' '),
      );

      li.append(htmlElement('button', {
        innerText: 'close',
        classList: ['material-symbols-outlined'],
        dataset: {field: param},
        onClick: e => {
          const btn = e.target as HTMLButtonElement;
          window.VIEW.removeGroup(btn.dataset.field as string);
          rebuildFilterList();
        },
      }));
    }

    for (const filter of item.filters) {
      const li = createFilterListItem(ul, param);
      li.append(
        htmlElement('span', {
          classList: ['isfilter'],
          innerText: filter.type.label,
        }),
        htmlText(' '),
        htmlElement('span', {
          classList: ['isvalue'],
          innerText: String(filter.testValue),
        }),
        htmlText(' '),
        htmlElement('button', {
          innerText: 'close',
          classList: ['material-symbols-outlined'],
          dataset: {
            field: param,
            filter: filter.type.label,
            value: String(filter.testValue),
          },
          onClick: e => {
            const btn = e.target as HTMLButtonElement;
            window.VIEW.removeFilter(
              btn.dataset.field as string,
              btn.dataset.filter as string,
              btn.dataset.value as string);
            rebuildFilterList();
          },
        })
      );
    }
  }
}

packets.FilterType.forEach(filter => {
  const option = document.createElement('option');
  option.innerText = filter.label;
  option.setAttribute('value', filter.label);
  querySelector('#filter').appendChild(option);
});

fieldAutocomplete();