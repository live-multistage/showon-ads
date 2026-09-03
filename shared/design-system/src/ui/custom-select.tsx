'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import styles from './custom-select.module.scss';

// ── Primitive re-exports ────────────────────────────────────────────────────

const CustomSelect = SelectPrimitive.Root;
const CustomSelectGroup = SelectPrimitive.Group;
const CustomSelectValue = SelectPrimitive.Value;

// ── Trigger ─────────────────────────────────────────────────────────────────

interface CustomSelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  leadingIcon?: React.ReactNode;
}

const CustomSelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  CustomSelectTriggerProps
>(({ children, leadingIcon, ...props }, ref) => (
  <SelectPrimitive.Trigger ref={ref} className={styles.trigger} {...props}>
    {leadingIcon && <span className={styles.triggerLeadingIcon}>{leadingIcon}</span>}
    <span className={styles.triggerValue}>{children}</span>
    <SelectPrimitive.Icon asChild>
      <ChevronDownIcon size={14} className={styles.triggerIcon} />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
CustomSelectTrigger.displayName = 'CustomSelectTrigger';

// ── Content ──────────────────────────────────────────────────────────────────

const CustomSelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={styles.content}
      sideOffset={4}
      {...props}
    >
      <CustomSelectScrollUpButton />
      <SelectPrimitive.Viewport className={styles.viewport}>
        {children}
      </SelectPrimitive.Viewport>
      <CustomSelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
CustomSelectContent.displayName = 'CustomSelectContent';

// ── Item ─────────────────────────────────────────────────────────────────────

interface CustomSelectItemProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  description?: string;
}

const CustomSelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  CustomSelectItemProps
>(({ children, description, ...props }, ref) => (
  <SelectPrimitive.Item ref={ref} className={styles.item} {...props}>
    <SelectPrimitive.ItemText>
      <span className={styles.itemText}>{children}</span>
    </SelectPrimitive.ItemText>
    {description && (
      <span className={styles.itemDescription}>{description}</span>
    )}
    <span className={styles.itemIndicator}>
      <SelectPrimitive.ItemIndicator>
        <CheckIcon size={12} />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
));
CustomSelectItem.displayName = 'CustomSelectItem';

// ── Label ────────────────────────────────────────────────────────────────────

const CustomSelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ ...props }, ref) => (
  <SelectPrimitive.Label ref={ref} className={styles.groupLabel} {...props} />
));
CustomSelectLabel.displayName = 'CustomSelectLabel';

// ── Separator ────────────────────────────────────────────────────────────────

const CustomSelectSeparator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={styles.separator} {...props} />
));
CustomSelectSeparator.displayName = 'CustomSelectSeparator';

// ── Scroll buttons ───────────────────────────────────────────────────────────

const CustomSelectScrollUpButton = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton ref={ref} className={styles.scrollButton} {...props}>
    <ChevronUpIcon size={14} />
  </SelectPrimitive.ScrollUpButton>
));
CustomSelectScrollUpButton.displayName = 'CustomSelectScrollUpButton';

const CustomSelectScrollDownButton = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton ref={ref} className={styles.scrollButton} {...props}>
    <ChevronDownIcon size={14} />
  </SelectPrimitive.ScrollDownButton>
));
CustomSelectScrollDownButton.displayName = 'CustomSelectScrollDownButton';

// ── Convenience wrapper ───────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

interface SimpleCustomSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  options?: SelectOption[];
  groups?: SelectOptionGroup[];
  leadingIcon?: React.ReactNode;
}

function SimpleCustomSelect({
  value,
  onValueChange,
  placeholder = 'Selecione...',
  disabled,
  options,
  groups,
  leadingIcon,
}: SimpleCustomSelectProps) {
  return (
    <CustomSelect value={value} onValueChange={onValueChange} disabled={disabled}>
      <CustomSelectTrigger leadingIcon={leadingIcon}>
        <CustomSelectValue placeholder={placeholder} />
      </CustomSelectTrigger>
      <CustomSelectContent>
        {options?.map((opt) => (
          <CustomSelectItem
            key={opt.value}
            value={opt.value}
            description={opt.description}
            disabled={opt.disabled}
          >
            {opt.label}
          </CustomSelectItem>
        ))}
        {groups?.map((group) => (
          <CustomSelectGroup key={group.label} className={styles.group}>
            <CustomSelectLabel>{group.label}</CustomSelectLabel>
            {group.options.map((opt) => (
              <CustomSelectItem
                key={opt.value}
                value={opt.value}
                description={opt.description}
                disabled={opt.disabled}
              >
                {opt.label}
              </CustomSelectItem>
            ))}
          </CustomSelectGroup>
        ))}
      </CustomSelectContent>
    </CustomSelect>
  );
}

export {
  CustomSelect,
  CustomSelectGroup,
  CustomSelectValue,
  CustomSelectTrigger,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectLabel,
  CustomSelectSeparator,
  CustomSelectScrollUpButton,
  CustomSelectScrollDownButton,
  SimpleCustomSelect,
};
