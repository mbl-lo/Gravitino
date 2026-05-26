interface PlaceholderPageProps {
  title: string
  icon: string
  description?: string
}

const PlaceholderPage = ({ title, icon, description }: PlaceholderPageProps) => {
  return (
    <div style={styles.container}>
      <div style={styles.icon}>{icon}</div>
      <h1 style={styles.title}>{title}</h1>
      <p style={styles.description}>
        {description || 'Страница в разработке'}
      </p>
      <div style={styles.placeholder}>
        <p>🎨 Здесь будет контент страницы "{title}"</p>
        <p style={styles.note}>Функционал появится в следующей версии</p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    textAlign: 'center' as const,
    padding: '48px 24px',
  },
  icon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '0.5rem',
  },
  description: {
    color: '#6b7280',
    marginBottom: '2rem',
  },
  placeholder: {
    backgroundColor: '#f9fafb',
    border: '1px dashed #d1d5db',
    borderRadius: '12px',
    padding: '48px 24px',
    maxWidth: '500px',
    margin: '0 auto',
  },
  note: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    marginTop: '1rem',
  },
}

export default PlaceholderPage