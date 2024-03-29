import test from 'ava';
import { FilterSet } from '../worker/filters';
import { FilterType } from '../worker/filterTypes';
import { PacketStore } from '../worker/packetStore'

function getFilterSet() {
  return new FilterSet(new PacketStore());
}

test('AddFilterFromState', t => {
  const filters = getFilterSet();
  filters.mergeFromState([ ['foo', '==', 'bar'] ]);
  t.deepEqual(filters.toJSON(), {foo: [{op: '==', testValue: 'bar'}]});
});

test('RemoveFilterFromState', t => {
  const filters = getFilterSet();
  filters.addFilter('foo', FilterType.get('=='), 'bar');
  filters.addFilter('foo', FilterType.get('=='), 'baz');
  filters.mergeFromState([ ['foo', '==', 'bar'] ]);
  t.deepEqual(filters.toJSON(), {foo: [{op: '==', testValue: 'bar'}]});
});

test('ClearFilterFromState', t => {
  const filters = getFilterSet();
  filters.addFilter('foo', FilterType.get('=='), 'bar');
  filters.addFilter('foo', FilterType.get('=='), 'baz');
  filters.mergeFromState([]);
  t.deepEqual(filters.toJSON(), {});
});

test('AddGroupFromState', t => {
  const filters = getFilterSet();
  filters.mergeFromState([['foo', '*', '']]);
  t.deepEqual(filters.toJSON(), {foo: [{op: '*', testValue: ''}]});
});

test('AddGroupToPrexistingFromState', t => {
  const filters = getFilterSet();
  filters.addFilter('foo', FilterType.get('=='), 'bar');
  filters.mergeFromState([
    ['foo', '==', 'bar'],
    ['foo', '*', ''],
  ]);
  t.deepEqual(filters.toJSON(), {foo: [
    {op: '*', testValue: ''},
    {op: '==', testValue: 'bar'},
  ]});
});

test('RemoveGroupToPrexistingFromState', t => {
  const filters = getFilterSet();
  filters.addFilter('foo', FilterType.get('=='), 'bar');
  filters.addGroup('foo');
  filters.mergeFromState([
    ['foo', '==', 'bar'],
  ]);
  t.deepEqual(filters.toJSON(), {foo: [
    {op: '==', testValue: 'bar'},
  ]});
});
