import React, { useState } from 'react'
import styles from './LoginPage.module.css'
import { Input } from '../../atoms/Input/Input'
import { Button } from '../../atoms/Button/Button'
import { Toggle } from '../../atoms/Toggle/Toggle'

export interface LoginPageProps {
  onLogin?: (email: string, password: string) => void
  onForgotPassword?: () => void
  onSignUp?: () => void
  loading?: boolean
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onForgotPassword,
  onSignUp,
  loading = false,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!email.trim()) newErrors.email = 'Email is required'
    if (!password.trim()) newErrors.password = 'Password is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    onLogin?.(email, password)
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Build better products with your team</h1>
        <p className={styles.heroSubtitle}>
          Our design system helps you create consistent, accessible, and beautiful interfaces faster than ever.
        </p>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formContainer}>
          <div className={styles.logo}>Design System</div>
          <h2 className={styles.formTitle}>Welcome back</h2>
          <p className={styles.formSubtitle}>Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.fields}>
              <Input
                id="login-email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email)
                    setErrors((p) => {
                      const n = { ...p }
                      delete n.email
                      return n
                    })
                }}
                state={errors.email ? 'error' : 'default'}
                helperText={errors.email}
              />
              <Input
                id="login-password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password)
                    setErrors((p) => {
                      const n = { ...p }
                      delete n.password
                      return n
                    })
                }}
                state={errors.password ? 'error' : 'default'}
                helperText={errors.password}
              />
            </div>

            <div className={styles.options}>
              <Toggle
                checked={rememberMe}
                onChange={setRememberMe}
                label="Remember me"
                size="sm"
              />
              <button
                type="button"
                className={styles.forgotLink}
                onClick={onForgotPassword}
              >
                Forgot password?
              </button>
            </div>

            <div className={styles.submitArea}>
              <Button variant="primary" size="lg" type="submit" loading={loading} style={{ width: '100%' }}>
                Sign in
              </Button>
            </div>
          </form>

          <div className={styles.divider}>
            <span className={styles.dividerText}>or</span>
          </div>

          <p className={styles.signupText}>
            Don&apos;t have an account?{' '}
            <span className={styles.signupLink} onClick={onSignUp} role="button" tabIndex={0}>
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
