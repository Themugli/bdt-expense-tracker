import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getActiveSession } from '@/lib/auth';
import { useLoans } from '@/hooks/useLoans';
import { Plus, X, Calendar as CalendarIcon, Loader2, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Loan } from '@/types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

function LoanModal({ isOpen, onClose, onSave, onUpdate, editingLoan, defaultType = 'payable' }: { isOpen: boolean; onClose: () => void; onSave: (loan: Omit<Loan, 'id'>) => Promise<boolean>; onUpdate?: (loan: Loan) => Promise<boolean>; editingLoan?: Loan | null; defaultType?: 'payable' | 'receivable' }) {
  const [type, setType] = useState<'payable' | 'receivable'>('payable');
  const [amount, setAmount] = useState('');
  const [personName, setPersonName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingLoan && isOpen) {
      setType(editingLoan.type);
      setAmount(editingLoan.amount.toString());
      setPersonName(editingLoan.person_name);
      setDueDate(editingLoan.due_date ? editingLoan.due_date.split('T')[0] : '');
      setNotes(editingLoan.notes || '');
    } else if (isOpen) {
      setType(defaultType);
      setAmount('');
      setPersonName('');
      setDueDate('');
      setNotes('');
    }
  }, [editingLoan, isOpen, defaultType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !personName) return;
    setIsSaving(true);
    
    let success = false;
    if (editingLoan && onUpdate) {
      success = await onUpdate({
        ...editingLoan,
        type,
        amount: parseFloat(amount),
        person_name: personName,
        due_date: dueDate || null,
        notes,
      });
    } else {
      success = await onSave({
        type,
        amount: parseFloat(amount),
        person_name: personName,
        due_date: dueDate || null,
        notes,
        status: 'pending',
      });
    }
    
    setIsSaving(false);
    if (success) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#24483c]/20 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
              className="w-full max-w-md bg-[#fcfcf9] rounded-[32px] p-6 shadow-2xl pointer-events-auto flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-[22px] font-extrabold text-[#24483c]">{editingLoan ? 'Edit Loan' : 'Add Loan'}</h2>
                <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full text-[#768980] hover:bg-[#edf1e8] hover:text-[#347d68] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex rounded-full bg-[#edf1e8] p-1">
                  <button
                    type="button"
                    onClick={() => setType('payable')}
                    className={cn("flex-1 rounded-full py-2.5 text-sm font-bold transition-all", type === 'payable' ? "bg-white text-[#24483c] shadow-sm" : "text-[#768980] hover:text-[#347d68]")}
                  >
                    I Owe
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('receivable')}
                    className={cn("flex-1 rounded-full py-2.5 text-sm font-bold transition-all", type === 'receivable' ? "bg-white text-[#24483c] shadow-sm" : "text-[#768980] hover:text-[#347d68]")}
                  >
                    Owed to Me
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#597369] mb-1.5 uppercase tracking-wider ml-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-full bg-[#edf1e8] px-5 py-3.5 text-[#24483c] font-medium placeholder:text-[#93a097] focus:outline-none focus:ring-2 focus:ring-[#347d68]/20 transition-all border-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#597369] mb-1.5 uppercase tracking-wider ml-2">Person Name</label>
                  <input
                    type="text"
                    required
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="w-full rounded-full bg-[#edf1e8] px-5 py-3.5 text-[#24483c] font-medium placeholder:text-[#93a097] focus:outline-none focus:ring-2 focus:ring-[#347d68]/20 transition-all border-none"
                    placeholder="E.g. Alex"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#597369] mb-1.5 uppercase tracking-wider ml-2">Due Date (Optional)</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-full bg-[#edf1e8] px-5 py-3.5 pl-12 text-[#24483c] font-medium placeholder:text-[#93a097] focus:outline-none focus:ring-2 focus:ring-[#347d68]/20 transition-all border-none"
                    />
                    <CalendarIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#93a097]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#597369] mb-1.5 uppercase tracking-wider ml-2">Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-full bg-[#edf1e8] px-5 py-3.5 text-[#24483c] font-medium placeholder:text-[#93a097] focus:outline-none focus:ring-2 focus:ring-[#347d68]/20 transition-all border-none"
                    placeholder="Details about this loan..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#347d68] py-4 text-base font-bold text-white shadow-lg shadow-[#347d68]/20 hover:bg-[#2a6855] hover:shadow-xl transition-all disabled:opacity-70"
                >
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : (editingLoan ? 'Update Loan' : 'Save Loan')}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function LoanTracker() {
  const session = getActiveSession();
  const isGuest = session ? session.isGuest : true;
  
  const { loans, isLoading, addLoan, updateLoan, deleteLoan } = useLoans();

  const [activeTab, setActiveTab] = useState<'payable' | 'receivable'>('payable');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<string | null>(null);

  const filteredLoans = loans.filter((l) => l.type === activeTab);
  
  const totalAmount = filteredLoans.reduce((sum, l) => sum + (l.status === 'pending' ? l.amount : 0), 0);

  const toggleStatus = (loan: Loan) => {
    updateLoan({ ...loan, status: loan.status === 'pending' ? 'settled' : 'pending' });
  };

  return (
    <div className="min-h-screen bg-[#fcfcf9] pb-32 pt-8 px-6 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12 flex items-end justify-between">
          <div>
            <h1 className="font-display text-[32px] font-extrabold tracking-[-.045em] text-[#24483c]">
              Loan Tracker
            </h1>
            <p className="text-sm text-[#597369] mt-2">Manage your payables and receivables</p>
          </div>
          <button
            onClick={() => {
              setEditingLoan(null);
              setIsModalOpen(true);
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#347d68] text-white shadow-lg shadow-[#347d68]/20 hover:bg-[#2a6855] hover:scale-105 transition-all"
            aria-label="Add Loan"
          >
            <Plus size={24} />
          </button>
        </header>

        <div className="flex rounded-full bg-[#edf1e8] p-1.5 mb-10 relative">
          <div className="flex-1 relative z-10">
            <button
              onClick={() => setActiveTab('payable')}
              className={cn("w-full rounded-full py-3 text-sm font-bold transition-colors", activeTab === 'payable' ? "text-[#24483c]" : "text-[#768980] hover:text-[#347d68]")}
            >
              Money I Owe
            </button>
          </div>
          <div className="flex-1 relative z-10">
            <button
              onClick={() => setActiveTab('receivable')}
              className={cn("w-full rounded-full py-3 text-sm font-bold transition-colors", activeTab === 'receivable' ? "text-[#24483c]" : "text-[#768980] hover:text-[#347d68]")}
            >
              Money Owed to Me
            </button>
          </div>
          
          <motion.div
            layoutId="tab-indicator"
            className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-full shadow-sm"
            animate={{ left: activeTab === 'payable' ? '6px' : 'calc(50% + 0px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        {isGuest ? (
          <div className="text-center py-20 bg-white rounded-[24px] shadow-sm border border-[#e6ebe3]">
            <h2 className="text-xl font-bold text-[#24483c] mb-2">Sign in Required</h2>
            <p className="text-[#768980]">Please log in to manage your loans and debts.</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <p className="text-sm font-semibold text-[#768980] uppercase tracking-wider mb-1">
                Total {activeTab === 'payable' ? 'Payables' : 'Receivables'} (Pending)
              </p>
              <div className="text-[48px] font-bold tracking-tight text-[#24483c] leading-none">
                ${totalAmount.toFixed(2)}
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 size={32} className="animate-spin text-[#347d68]" />
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredLoans.map((loan) => (
                <motion.div
                  key={loan.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[24px] bg-white transition-all group",
                    loan.status === 'settled' ? "opacity-60 grayscale hover:grayscale-0" : "shadow-sm hover:shadow-md border border-[#e6ebe3]"
                  )}
                >
                  <div className="flex flex-col gap-1 mb-4 sm:mb-0">
                    <div className="flex items-center gap-3">
                      <h3 className={cn("font-bold text-[17px] text-[#24483c]", loan.status === 'settled' && "line-through text-[#768980]")}>
                        {loan.person_name}
                      </h3>
                      <button
                        onClick={() => toggleStatus(loan)}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-colors",
                          loan.status === 'settled' 
                            ? "bg-[#edf1e8] text-[#768980] hover:bg-[#e6ebe3]" 
                            : "bg-[#e2f1eb] text-[#347d68] hover:bg-[#d1e9de]"
                        )}
                      >
                        {loan.status}
                      </button>
                    </div>
                    {(loan.due_date || loan.notes) && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-[#768980] text-xs font-medium mt-1">
                        {loan.due_date && <span>Due: {new Date(loan.due_date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                        {loan.notes && <span className="line-clamp-1">{loan.notes}</span>}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={cn("text-[20px] font-bold", activeTab === 'payable' ? "text-[#d78967]" : "text-[#347d68]", loan.status === 'settled' && "text-[#93a097]")}>
                      ${loan.amount.toFixed(2)}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingLoan(loan);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-[#93a097] hover:bg-[#edf1e8] hover:text-[#347d68] rounded-full transition-colors"
                        aria-label="Edit loan"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setLoanToDelete(loan.id)}
                        className="p-2 text-[#93a097] hover:bg-[#fee2e2] hover:text-[#dc2626] rounded-full transition-colors"
                        aria-label="Delete loan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {filteredLoans.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 text-[#93a097] font-medium"
                >
                  No {activeTab}s recorded yet.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
            )}
          </>
        )}
      </div>

      <LoanModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={addLoan} 
        onUpdate={updateLoan}
        editingLoan={editingLoan}
        defaultType={activeTab}
      />

      <ConfirmModal
        isOpen={!!loanToDelete}
        title="Delete this loan?"
        description="Are you sure you want to delete this loan? This action cannot be undone."
        onCancel={() => setLoanToDelete(null)}
        onConfirm={() => {
          if (loanToDelete) deleteLoan(loanToDelete);
          setLoanToDelete(null);
        }}
      />
    </div>
  );
}
