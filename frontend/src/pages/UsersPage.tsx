import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const toastStyle = document.createElement('style');
toastStyle.textContent = `
  @keyframes slideInTop {
    from { transform: translateX(120%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .toast-error {
    animation: slideInTop 0.3s ease-out;
  }
`;
document.head.appendChild(toastStyle);

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

const ROLE_MAP: Record<string, string> = {
  admin: 'Администратор',
  operator: 'Оператор',
  manager: 'Менеджер',
  accountant: 'Бухгалтер',
};

function formatDisplayName(fullName: string) {
  const parts = fullName.trim().split(' ');
  if (parts.length >= 3) return `${parts[1]} ${parts[0]}`;
  if (parts.length === 2) return `${parts[1]} ${parts[0]}`;
  return fullName;
}

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function formatLastActivity(date?: string) {
  if (!date) return '—';
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return `Сегодня, ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDays === 1) return `Вчера, ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  return `${diffDays} дня назад`;
}

const AVATAR_COLOR = '#3b82f6';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'operator', departmentId: '22222222-2222-4222-8222-222222222222' });
  const [submitting, setSubmitting] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', role: '' });

  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpenId]);

  useEffect(() => {
    api.get<User[]>('/users')
      .then((res) => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleAddUser() {
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Заполните все обязательные поля');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/users', { ...form, organizationId: (currentUser as any)?.organizationId, departmentId: form.departmentId });
      const res = await api.get<User[]>('/users');
      setUsers(res.data);
      setShowModal(false);
      setForm({ fullName: '', email: '', password: '', role: 'operator' });
    } catch {
      setError('Ошибка при создании пользователя');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(id: string) {
    await api.patch(`/users/${id}/deactivate`);
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: !u.isActive } : u));
    setMenuOpenId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить пользователя?')) return;
    await api.delete(`/users/${id}`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setMenuOpenId(null);
  }

  async function handleEdit() {
    if (!editUser) return;
    if (!editForm.fullName.trim() || !editForm.email.trim()) {
      setError('Заполните все обязательные поля');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/users/${editUser.id}`, editForm);
      const res = await api.get<User[]>('/users');
      setUsers(res.data);
      setEditUser(null);
    } finally {
      setSubmitting(false);
    }
  }

  const total = users.length;
  const active = users.filter((u) => u.isActive).length;
  const admins = users.filter((u) => u.role === 'admin').length;
  const inactive = users.filter((u) => !u.isActive).length;

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', margin: 0 }}>Пользователи</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Управление пользователями и правами доступа</p>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              if (currentUser?.role !== 'admin') {
                setError('Только администратор может добавлять пользователей');
                setTimeout(() => setError(''), 3000);
              } else {
                setShowModal(true);
              }
            }}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}>
            + Добавить пользователя
          </button>
          {error && (
            <div className="toast-error" style={{
              position: 'fixed',
              top: '1.5rem',
              right: '2rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              color: '#dc2626',
              fontSize: '0.875rem',
              fontWeight: '500',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              zIndex: 1000,
            }}>
              {error}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Всего пользователей', value: total, color: '#111827' },
          { label: 'Активных сегодня', value: active, color: '#16a34a' },
          { label: 'Администраторов', value: admins, color: '#111827' },
          { label: 'Неактивных', value: inactive, color: '#111827' },
        ].map((stat) => (
          <div key={stat.label} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid #e5e7eb',
          }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>{stat.label}</p>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: stat.color, margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Загрузка...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                {['Пользователь', 'Email', 'Роль', 'Статус', 'Последняя активность', 'Действия'].map((col) => (
                  <th key={col} style={{
                    padding: '0.875rem 1.25rem',
                    textAlign: 'left',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: '#374151',
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2.25rem',
                        height: '2.25rem',
                        borderRadius: '50%',
                        backgroundColor: AVATAR_COLOR,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        flexShrink: 0,
                      }}>
                        {getInitials(formatDisplayName(user.fullName))}
                      </div>
                      <span style={{ fontWeight: '500', color: '#111827' }}>{formatDisplayName(user.fullName)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#4b5563', fontSize: '0.875rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                      </svg>
                      {user.email}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#4b5563', fontSize: '0.875rem' }}>
                    {ROLE_MAP[user.role] ?? user.role}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{
                      backgroundColor: user.isActive ? '#dcfce7' : '#f3f4f6',
                      color: user.isActive ? '#16a34a' : '#6b7280',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.8125rem',
                      fontWeight: '500',
                    }}>
                      {user.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#4b5563', fontSize: '0.875rem' }}>
                    {formatLastActivity(user.lastLoginAt)}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', position: 'relative' }}>
                    <button
                      onClick={(e) => {
                        if (currentUser?.role !== 'admin') {
                          setError('Только администратор может управлять пользователями');
                          setTimeout(() => setError(''), 3000);
                          return;
                        }
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === user.id ? null : user.id);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#6b7280' }}>⋮</button>
                    {menuOpenId === user.id && (
                      <div style={{ position: 'absolute', right: '1rem', top: '3rem', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '160px' }}>
                        {[
                          { label: 'Редактировать', action: () => { setEditUser(user); setEditForm({ fullName: user.fullName, email: user.email, role: user.role }); setMenuOpenId(null); } },
                          { label: user.isActive ? 'Деактивировать' : 'Активировать', action: () => handleDeactivate(user.id) },
                          { label: 'Удалить', action: () => handleDelete(user.id), danger: true },
                        ].map((item) => (
                          <button key={item.label} onClick={item.action} style={{ display: 'block', width: '100%', padding: '0.625rem 1rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: (item as any).danger ? '#dc2626' : '#111827' }}>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setEditUser(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#111827' }}>Редактировать пользователя</h2>
            {([['fullName', 'ФИО'], ['email', 'Email']] as const).map(([field, label]) => (
              <div key={field} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.375rem' }}>{label}</label>
                <input value={editForm[field]} onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.375rem' }}>Роль</label>
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem' }}>
                <option value="operator">Оператор</option>
                <option value="manager">Менеджер</option>
                <option value="accountant">Бухгалтер</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditUser(null)} style={{ padding: '0.625rem 1.25rem', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem' }}>Отмена</button>
              <button onClick={handleEdit} disabled={submitting} style={{ padding: '0.625rem 1.25rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
                {submitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setShowModal(false)}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#111827' }}>Добавить пользователя</h2>
            {(['fullName', 'email', 'password'] as const).map((field) => (
              <div key={field} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.375rem' }}>
                  {{ fullName: 'ФИО', email: 'Email', password: 'Пароль' }[field]}
                </label>
                <input
                  type={field === 'password' ? 'password' : 'text'}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.375rem' }}>Роль</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem' }}>
                <option value="operator">Оператор</option>
                <option value="manager">Менеджер</option>
                <option value="accountant">Бухгалтер</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.375rem' }}>Отдел</label>
              <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem' }}>
                <option value="22222222-2222-4222-8222-222222222222">Автоколонна 1</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '0.625rem 1.25rem', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem' }}>
                Отмена
              </button>
              <button onClick={handleAddUser} disabled={submitting} style={{ padding: '0.625rem 1.25rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
                {submitting ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
