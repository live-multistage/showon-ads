declare module "*.module.scss" {
  const classes: { readonly [className: string]: string };
  export default classes;
}

declare module "*.css" {
  const content: { readonly [className: string]: string };
  export default content;
}
