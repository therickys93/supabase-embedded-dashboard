"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z, ZodTypeAny } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useRef } from "react";

interface DynamicFormProps {
  schema: z.ZodObject<any, any, any>;
  onSubmit: (data: z.infer<any>) => void;
  isLoading?: boolean;
  initialValues?: Record<string, any>;
  labels?: Record<
    string,
    string | { label: string; options?: Record<string, string> }
  >;
  columnInfo?: Record<string, { data_type: string; is_nullable: boolean }>;
}

// Helper function to unwrap Zod types (Optional, Default, Effects)
const unwrapZodType = (fieldSchema: ZodTypeAny): ZodTypeAny => {
  if (
    !fieldSchema ||
    typeof fieldSchema._def !== "object" ||
    fieldSchema._def === null
  ) {
    throw new Error(
      `unwrapZodType received an invalid Zod schema object. Check the console for the problematic schema/key.`
    );
  }
  let currentSchema = fieldSchema;
  while (
    currentSchema._def.typeName === "ZodOptional" ||
    currentSchema._def.typeName === "ZodDefault" ||
    currentSchema._def.typeName === "ZodNullable" ||
    currentSchema._def.typeName === "ZodEffects"
  ) {
    if (currentSchema._def.typeName === "ZodEffects") {
      // For ZodEffects, get the schema inside the effect
      currentSchema = (currentSchema._def as any).schema;
    } else {
      currentSchema = (currentSchema._def as any).innerType;
    }
  }
  return currentSchema;
};

export function DynamicForm({
  schema,
  onSubmit,
  isLoading = false,
  initialValues,
  labels,
  columnInfo,
}: DynamicFormProps) {
  const isInitializingRef = useRef(true);

  const defaultValues = Object.keys(schema.shape).reduce((acc, key) => {
    const originalFieldSchema = schema.shape[key];
    if (typeof originalFieldSchema === "undefined") {
      throw new Error(
        `Schema error: schema.shape['${key}'] is undefined. Check schema definition.`
      );
    }

    if (originalFieldSchema._def.typeName === "ZodDefault") {
      acc[key] = originalFieldSchema._def.defaultValue();
      return acc;
    }

    const baseType = unwrapZodType(originalFieldSchema);

    switch (baseType._def.typeName) {
      case "ZodString":
        acc[key] = "";
        break;
      case "ZodBoolean":
        acc[key] = false; // Default optional booleans to false
        break;
      case "ZodEnum":
        // For enums, use the first enum value as default
        const enumValues = (baseType._def as any).values || [];
        acc[key] = enumValues.length > 0 ? enumValues[0] : "";
        break;
      case "ZodNumber":
        acc[key] = 0; // Default optional numbers to 0
        break;
      case "ZodArray":
        acc[key] = []; // Default arrays to empty array
        break;
      default:
        acc[key] = undefined; // For other types, or if truly no default makes sense
        break;
    }
    return acc;
  }, {} as any);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (initialValues) {
      isInitializingRef.current = true;
      const schemaKeys = Object.keys(schema.shape);
      const processedInitialValues = schemaKeys.reduce((acc, key) => {
        const fieldDefFromSchema = schema.shape[key];
        if (typeof fieldDefFromSchema === "undefined") {
          throw new Error(
            `Schema error in useEffect: schema.shape['${key}'] is undefined.`
          );
        }
        const value = initialValues.hasOwnProperty(key)
          ? initialValues[key]
          : undefined;
        const baseFieldType = unwrapZodType(fieldDefFromSchema);

        if (baseFieldType._def.typeName === "ZodBoolean") {
          acc[key] = !!value;
        } else if (baseFieldType._def.typeName === "ZodString") {
          acc[key] = value === null || value === undefined ? "" : String(value);
        } else if (baseFieldType._def.typeName === "ZodEnum") {
          const enumValues = (baseFieldType._def as any).values || [];
          acc[key] =
            value === null || value === undefined || !enumValues.includes(value)
              ? enumValues[0] || ""
              : String(value);
        } else if (baseFieldType._def.typeName === "ZodNumber") {
          const num = Number(value);
          acc[key] = isNaN(num) ? 0 : num;
        } else if (baseFieldType._def.typeName === "ZodArray") {
          // For arrays, the value should already be an array from the database
          // Handle null values properly
          if (Array.isArray(value)) {
            acc[key] = value;
          } else if (value === null || value === undefined) {
            acc[key] = [];
          } else if (
            typeof value === "string" &&
            value.startsWith("{") &&
            value.endsWith("}")
          ) {
            // Parse PostgreSQL array format like {ONE,TWO} into JavaScript array
            try {
              const innerContent = value.slice(1, -1); // Remove { and }
              if (innerContent.trim() === "") {
                acc[key] = [];
              } else {
                // Split by comma and trim whitespace
                acc[key] = innerContent.split(",").map((item) => item.trim());
              }
            } catch {
              // If parsing fails, default to empty array
              acc[key] = [];
            }
          } else {
            acc[key] = [];
          }
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      form.reset(processedInitialValues);
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 0);
    } else {
      isInitializingRef.current = false;
    }
  }, [initialValues, form, schema]);

  const renderField = (fieldName: string, fieldSchema: ZodTypeAny) => {
    const baseType = unwrapZodType(fieldSchema);
    const typeName = baseType._def.typeName;
    const description = fieldSchema.description;

    return (
      <FormField
        key={fieldName}
        control={form.control}
        name={fieldName}
        render={({ field }) => {
          const labelConfig = labels?.[fieldName];
          const label =
            typeof labelConfig === "string"
              ? labelConfig
              : labelConfig?.label || fieldName;
          const typeDisplay = columnInfo?.[fieldName]?.data_type || "";
          switch (typeName) {
            case "ZodString":
              return (
                <FormItem className="py-6 border-b">
                  <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between w-full gap-4 lg:gap-8">
                    <div className="flex-1 pr-4">
                      <FormLabel>{label}</FormLabel>
                      <div className="text-sm text-muted-foreground mt-1">
                        {typeDisplay}
                      </div>
                      {description && (
                        <FormDescription>{description}</FormDescription>
                      )}
                      <FormMessage />
                    </div>
                    <div className="flex-1 lg:max-w-1/2">
                      <FormControl>
                        <Input
                          placeholder={`Enter your ${fieldName}`}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                    </div>
                  </div>
                </FormItem>
              );
            case "ZodNumber":
              return (
                <FormItem className="py-6 border-b">
                  <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between w-full gap-4 lg:gap-8">
                    <div className="flex-1 pr-4">
                      <FormLabel>{label}</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {typeDisplay}
                      </div>
                      {description && (
                        <FormDescription>{description}</FormDescription>
                      )}
                      <FormMessage />
                    </div>
                    <div className="flex-1 lg:max-w-1/2">
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={`Enter value for ${fieldName}`}
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            const num = parseInt(value, 10);
                            field.onChange(isNaN(num) ? undefined : num);
                          }}
                        />
                      </FormControl>
                    </div>
                  </div>
                </FormItem>
              );
            case "ZodBoolean":
              return (
                <FormItem className="py-6 border-b flex flex-row items-center justify-between gap-8">
                  <div>
                    <FormLabel>{label}</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {typeDisplay}
                    </div>
                    {description && (
                      <FormDescription>{description}</FormDescription>
                    )}
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              );
            case "ZodEnum":
              const options = (baseType._def as any).values;
              const optionLabels =
                typeof labelConfig === "object"
                  ? labelConfig.options
                  : undefined;
              return (
                <FormItem className="py-6 border-b">
                  <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between w-full gap-4 lg:gap-8">
                    <div className="flex-1 pr-4">
                      <FormLabel>{label}</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {typeDisplay}
                      </div>
                      {description && (
                        <FormDescription>{description}</FormDescription>
                      )}
                      <FormMessage />
                    </div>
                    <div className="flex-1 lg:max-w-1/2">
                      <Select
                        onValueChange={(value) => {
                          if (!isInitializingRef.current) {
                            field.onChange(value);
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={`Select a ${fieldName}`}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {options.map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {optionLabels?.[option] || option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </FormItem>
              );
            case "ZodArray":
              return (
                <FormItem className="py-6 border-b">
                  <div className="flex flex-row items-center justify-between w-full gap-8">
                    <div className="flex-1 pr-4">
                      <FormLabel>{label}</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enter as JSON array: ["item1", "item2"]
                        {columnInfo?.[fieldName]?.is_nullable &&
                          " (leave empty for null)"}
                      </div>

                      {description && (
                        <FormDescription>{description}</FormDescription>
                      )}
                      <FormMessage />
                    </div>
                    <div className="flex-1">
                      <FormControl>
                        <Input
                          placeholder={
                            columnInfo?.[fieldName]?.is_nullable
                              ? `["item1", "item2"] or leave empty for null`
                              : `["item1", "item2"]`
                          }
                          {...field}
                          value={
                            field.value === null || field.value === undefined
                              ? ""
                              : Array.isArray(field.value)
                              ? JSON.stringify(field.value)
                              : field.value || ""
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.trim() === "") {
                              // Empty string means null (for nullable) or empty array (for non-nullable)
                              field.onChange(null);
                            } else {
                              try {
                                const parsed = JSON.parse(value);
                                if (Array.isArray(parsed)) {
                                  field.onChange(parsed);
                                } else {
                                  // If it's not an array, treat as invalid input
                                  field.onChange(value);
                                }
                              } catch {
                                // Invalid JSON, keep the string value to show error
                                field.onChange(value);
                              }
                            }
                          }}
                        />
                      </FormControl>
                    </div>
                  </div>
                </FormItem>
              );
            default:
              return <></>;
          }
        }}
      />
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {Object.keys(schema.shape).map((fieldName) =>
          renderField(fieldName, schema.shape[fieldName])
        )}
        <div className="pt-6">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
