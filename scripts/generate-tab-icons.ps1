Add-Type -AssemblyName System.Drawing

function New-FamilyTabIcon($path, $hexColor) {
  $bitmap = [System.Drawing.Bitmap]::new(64, 64)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $color = [System.Drawing.ColorTranslator]::FromHtml($hexColor)
  $pen = [System.Drawing.Pen]::new($color, 3.5)
  $bindingPen = [System.Drawing.Pen]::new($color, 2.5)
  $fill = [System.Drawing.SolidBrush]::new($color)

  $outline = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $outline.AddArc(14, 8, 8, 8, 180, 90)
  $outline.AddArc(44, 8, 8, 8, 270, 90)
  $outline.AddArc(44, 48, 8, 8, 0, 90)
  $outline.AddArc(14, 48, 8, 8, 90, 90)
  $outline.CloseFigure()
  $graphics.DrawPath($pen, $outline)
  $graphics.DrawLine($bindingPen, 24, 10, 24, 54)
  $graphics.DrawLine($bindingPen, 14, 20, 24, 20)
  $graphics.DrawLine($bindingPen, 14, 32, 24, 32)
  $graphics.DrawLine($bindingPen, 14, 44, 24, 44)
  $graphics.FillRectangle($fill, 33, 21, 11, 2.8)
  $graphics.FillRectangle($fill, 33, 30, 11, 2.8)
  $graphics.FillRectangle($fill, 33, 39, 11, 2.8)

  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $fill.Dispose()
  $outline.Dispose()
  $bindingPen.Dispose()
  $pen.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

New-FamilyTabIcon (Join-Path $PSScriptRoot '..\static\tab-family.png') '#8b9992'
New-FamilyTabIcon (Join-Path $PSScriptRoot '..\static\tab-family-active.png') '#a58a5a'
