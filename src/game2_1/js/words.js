// Danh sách từ tiếng Anh
const words = [
    'apple', 'banana', 'cat', 'dog', 'elephant', 'fish', 'grape', 'house', 'ice', 'jungle',
    'kite', 'lion', 'mouse', 'nose', 'orange', 'pig', 'queen', 'rabbit', 'sun', 'tree',
    'umbrella', 'van', 'water', 'xylophone', 'yellow', 'zebra', 'photoshop', 'illustrator',
    'indesign', 'vector', 'pixel', 'typography', 'sketch', 'figma', 'adobe', 'canva',
    'blender', 'maya', 'zbrush', 'design', 'graphic', 'creative', 'palette', 'gradient',
    'saturation', 'contrast', 'brightness', 'hue', 'filter', 'layer', 'brush', 'pencil',
    'eraser', 'selection', 'transform', 'rotate', 'scale', 'opacity', 'canvas', 'frame',
    'shape', 'circle', 'square', 'triangle', 'polygon', 'path', 'bezier', 'curve', 'stroke',
    'fill', 'border', 'shadow', 'glow', 'blur', 'sharpen', 'texture', 'pattern', 'material',
    'rendering', 'animation', 'keyframe', 'timeline', 'transition', 'effect', 'composition',
    'layout', 'alignment', 'spacing', 'padding', 'margin', 'grid', 'column', 'row', 'hierarchy',
    'balance', 'symmetry', 'asymmetry', 'proportion', 'emphasis', 'unity', 'variety', 'movement',
    'rhythm', 'flow', 'depth', 'perspective', 'dimension', 'form', 'space', 'color', 'tone',
    'shade', 'tint', 'warm', 'cool', 'neutral', 'monochrome', 'complementary', 'analogous',
    'triad', 'rule', 'third', 'golden', 'ratio', 'interface', 'wireframe', 'prototype', 'mockup',
    'usability', 'accessibility', 'responsive', 'mobile', 'desktop', 'tablet', 'resolution',
    'quality', 'benchmark', 'portfolio', 'client', 'project', 'deadline', 'revision', 'feedback',
    'approval', 'brand', 'logo', 'icon', 'symbol', 'mark', 'trademark', 'copyright', 'license',
    'asset', 'resource', 'library', 'template', 'preset', 'export', 'import', 'format', 'dimension',
    'aspect', 'photograph', 'image', 'video', 'audio', 'media', 'file', 'folder', 'directory',
    'document', 'spreadsheet', 'presentation', 'database', 'server', 'cloud', 'storage', 'backup',
    'archive', 'compress', 'extract', 'software', 'hardware', 'network', 'internet', 'website',
    'application', 'programming', 'code', 'script', 'developer', 'engineer', 'architect', 'manager',
    'director', 'consultant', 'freelancer', 'team', 'collaboration', 'communication', 'workflow', 
    'process', 'methodology', 'agile', 'scrum', 'kanban', 'sprint', 'milestone', 'deliverable', 'stakeholder', 'budget', 'cost',
    'revenue', 'profit', 'loss', 'investment', 'return', 'risk', 'opportunity', 'market',
    'competition', 'strategy', 'tactic', 'analysis', 'research', 'development', 'innovation',
    'technology', 'trend', 'future', 'emerging', 'disruptive', 'cutting-edge', 'breakthrough', 
    'state-of-the-art', 'next-gen', 'scalable', 'sustainable', 'efficient', 'effective', 'impactful', 
    'transformative', 'game-changing', 'paradigm-shifting', 'revolutionary', 'groundbreaking', 'unprecedented', 
    'unparalleled', 'unmatched', 'unrivaled', 'unbeatable', 'ultimate', 'definitive', 'comprehensive', 
    'holistic', 'integrated', 'end-to-end', 'turnkey', 'plug-and-play'

];

// Từ khó (2 điểm)
const hardWords = new Set([
    'typography', 'vector', 'pixel', 'zbrush', 'maya', 'blender', 'indesign', 'saturation',
    'contrast', 'brightness', 'gradient', 'bezier', 'composition', 'asymmetry', 'proportion',
    'perspective', 'complementary', 'analogous', 'golden', 'wireframe', 'prototype', 'usability',
    'accessibility', 'responsive', 'trademark', 'photograph', 'presentation', 'database', 'programmer',
    'architecture'
]);

// Từ siêu khó (3 điểm)
const superHardWords = new Set([
    'magnanimous', 'phenomenological', 'incommensurable', 'quintessential', 'pusillanimous',
    'sanguineous', 'misanthropic', 'existentialism', 'vicissitude', 'synchronicity', 'fastidious',
    'supercilious', 'incorrigible', 'sedulous', 'capricious'
]);

// Từ super khó (5 điểm)
const extremeHardWords = new Set([
    'pneumonoultramicroscopicsilicovolcanoconiosis', 'hippopotomonstrosesquippedaliophobia',
    'pseudopseudohypoparathyroidism', 'floccinaucinihilipilification', 'antidisestablishmentarianism',
    'honorificabilitudinitatibus', 'supercalifragilisticexpialidocious', 'aequeosalinocalcalinoceraceoaluminosocupreovitriolic',
    'chargoggagoggmanchauggagoggchaubunagungamaugg', 'eellogofusciouhipoppokunurious', 'thyroparathyroidectomized',
    'dichlorodifluoromethane', 'psychoneuroendocrinological', 'spectrophotofluorometrically'
]);
