Add-Type -AssemblyName System.Drawing

$outputDirectory = Join-Path $PSScriptRoot '..\static'
$icons = @(
    @{ Name = 'tab-home.png'; Kind = 'home'; Color = '#8b9992' },
    @{ Name = 'tab-home-active.png'; Kind = 'home'; Color = '#d97754' },
    @{ Name = 'tab-me.png'; Kind = 'person'; Color = '#8b9992' },
    @{ Name = 'tab-me-active.png'; Kind = 'person'; Color = '#d97754' }
)

foreach ($icon in $icons) {
    $bitmap = New-Object System.Drawing.Bitmap(81, 81)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.TranslateTransform(0, 0)
    $graphics.ScaleTransform(3.375, 3.375)
    $pen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml($icon.Color), 1.8)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    if ($icon.Kind -eq 'home') {
        $graphics.DrawLines($pen, [System.Drawing.PointF[]]@(
            [System.Drawing.PointF]::new(3, 10),
            [System.Drawing.PointF]::new(12, 3),
            [System.Drawing.PointF]::new(21, 10)
        ))
        $graphics.DrawLine($pen, 5, 9, 5, 20)
        $graphics.DrawLine($pen, 19, 9, 19, 20)
        $graphics.DrawLine($pen, 5, 20, 19, 20)
        $graphics.DrawLines($pen, [System.Drawing.PointF[]]@(
            [System.Drawing.PointF]::new(10, 20),
            [System.Drawing.PointF]::new(10, 14),
            [System.Drawing.PointF]::new(14, 14),
            [System.Drawing.PointF]::new(14, 20)
        ))
    } else {
        $graphics.DrawEllipse($pen, 8, 3, 8, 8)
        $graphics.DrawBezier($pen, 4, 19, 4, 11, 20, 11, 20, 19)
        $graphics.DrawLine($pen, 4, 19, 4, 21)
        $graphics.DrawLine($pen, 20, 19, 20, 21)
    }

    $bitmap.Save((Join-Path $outputDirectory $icon.Name), [System.Drawing.Imaging.ImageFormat]::Png)
    $pen.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
}
