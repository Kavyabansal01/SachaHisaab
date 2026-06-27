import { createContext, useContext, useMemo, useState } from 'react';
import {
  addRepayment,
  deleteCustomer,
  deleteEntry,
  getCustomer,
  listCustomers,
  listEntries,
  listRepayments,
  loadCalendarActivity,
  loadDashboard,
  saveCustomer,
  saveEntry,
} from '../data/database';

const LedgerContext = createContext(null);

export function LedgerProvider({ children }) {
  const [refreshKey, setRefreshKey] = useState(0);

  function bump() {
    setRefreshKey((value) => value + 1);
  }

  async function createOrUpdateCustomer(customer) {
    const id = await saveCustomer(customer);
    bump();
    return id;
  }

  async function removeCustomer(id) {
    await deleteCustomer(id);
    bump();
  }

  async function createOrUpdateEntry(entry) {
    const id = await saveEntry(entry);
    bump();
    return id;
  }

  async function removeEntry(id) {
    await deleteEntry(id);
    bump();
  }

  async function createRepayment(repayment, allocations) {
    await addRepayment(repayment, allocations);
    bump();
  }

  const value = useMemo(
    () => ({
      refreshKey,
      listCustomers,
      getCustomer,
      listEntries,
      listRepayments,
      loadDashboard,
      loadCalendarActivity,
      saveCustomer: createOrUpdateCustomer,
      deleteCustomer: removeCustomer,
      saveEntry: createOrUpdateEntry,
      deleteEntry: removeEntry,
      addRepayment: createRepayment,
    }),
    [refreshKey]
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger() {
  const value = useContext(LedgerContext);
  if (!value) {
    throw new Error('useLedger must be used inside LedgerProvider');
  }
  return value;
}
