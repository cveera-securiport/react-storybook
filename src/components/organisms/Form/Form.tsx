import React, { useState } from 'react'
import styles from './Form.module.css'
import { Input } from '../../atoms/Input/Input'
import { Button } from '../../atoms/Button/Button'

export interface FormField {
  name: string
  label: string
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  required?: boolean
  half?: boolean
}

export interface FormProps {
  title?: string
  description?: string
  fields: FormField[]
  submitLabel?: string
  onSubmit?: (values: Record<string, string>) => void
  onCancel?: () => void
  loading?: boolean
}

export const Form: React.FC<FormProps> = ({
  title,
  description,
  fields,
  submitLabel = 'Submit',
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    fields.forEach((field) => {
      if (field.required && !values[field.name]?.trim()) {
        newErrors[field.name] = `${field.label} is required`
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit?.(values)
  }

  // Group fields: full-width and half-width pairs
  const renderFields = () => {
    const elements: React.ReactNode[] = []
    let i = 0
    while (i < fields.length) {
      const field = fields[i]
      if (field.half && i + 1 < fields.length && fields[i + 1].half) {
        const next = fields[i + 1]
        elements.push(
          <div key={`${field.name}-${next.name}`} className={styles.row}>
            <Input
              id={`field-${field.name}`}
              label={field.label}
              placeholder={field.placeholder}
              type={field.type}
              value={values[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              state={errors[field.name] ? 'error' : 'default'}
              helperText={errors[field.name]}
            />
            <Input
              id={`field-${next.name}`}
              label={next.label}
              placeholder={next.placeholder}
              type={next.type}
              value={values[next.name] || ''}
              onChange={(e) => handleChange(next.name, e.target.value)}
              state={errors[next.name] ? 'error' : 'default'}
              helperText={errors[next.name]}
            />
          </div>
        )
        i += 2
      } else {
        elements.push(
          <Input
            key={field.name}
            id={`field-${field.name}`}
            label={field.label}
            placeholder={field.placeholder}
            type={field.type}
            value={values[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            state={errors[field.name] ? 'error' : 'default'}
            helperText={errors[field.name]}
          />
        )
        i++
      }
    }
    return elements
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {title && (
        <div>
          <h2 className={styles.title}>{title}</h2>
          {description && <p className={styles.description}>{description}</p>}
        </div>
      )}
      <div className={styles.fields}>{renderFields()}</div>
      <div className={styles.actions}>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} type="button">
            Cancel
          </Button>
        )}
        <Button variant="primary" type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
