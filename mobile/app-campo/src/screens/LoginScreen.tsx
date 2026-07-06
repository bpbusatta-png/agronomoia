import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useAuth } from '../auth/AuthContext'

export function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      setError('E-mail ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Agrônomo IA</Text>
        <Text style={styles.subtitle}>App de campo</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          testID="email-input"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          testID="password-input"
        />

        <Pressable style={styles.button} onPress={handleLogin} disabled={loading} testID="login-button">
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#08060d',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#15803d',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 8,
  },
})
