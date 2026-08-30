import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { CategoryInfo, CategorySlug } from '../../types';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Smile,
  AlertTriangle,
  FileText
} from 'lucide-react';

const SUGGESTED_EMOJIS = [
  '🔧', '🎓', '🛡️', '🧭', '✈️', '⚙️', '🚀', '🛩️',
  '🚁', '🎖️', '📋', '⚡', '🔍', '📊', '🛠️', '🛫',
  '🛬', '🌐', '💡', '🛰️', '🧑‍✈️', '🧯', '📡', '📑',
  '🧰', '🔬', '🏷️', '🚨', '🛢️', '🌍', '📐', '📦'
];

export const CategoryManager: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, posts, updatePost } = useBlog();

  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Form states
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catEmoji, setCatEmoji] = useState('✈️');
  const [autoSlug, setAutoSlug] = useState(true);

  // Feedback message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleNameChange = (val: string) => {
    setCatName(val);
    if (autoSlug && !editingCatId) {
      setCatSlug(slugify(val));
    }
  };

  const startEdit = (cat: CategoryInfo) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDesc(cat.description || '');
    setCatEmoji(cat.emoji || '✈️');
    setAutoSlug(false);
    setFeedback(null);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingCatId(null);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setCatEmoji('✈️');
    setAutoSlug(true);
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catSlug.trim()) {
      setFeedback({ type: 'error', text: 'Por favor, preencha o nome e o slug da categoria.' });
      return;
    }

    const cleanSlug = slugify(catSlug.trim());
    const cleanEmoji = catEmoji.trim() || '✈️';

    try {
      if (editingCatId) {
        const oldCat = categories.find(c => c.id === editingCatId);
        const oldSlug = oldCat?.slug;

        await updateCategory(editingCatId, {
          name: catName.trim(),
          slug: cleanSlug as CategorySlug,
          description: catDesc.trim(),
          emoji: cleanEmoji
        });

        // If slug changed, update all posts using the old slug
        if (oldSlug && oldSlug !== cleanSlug) {
          const affectedPosts = posts.filter(p => p.category === oldSlug);
          for (const post of affectedPosts) {
            await updatePost(post.id, { category: cleanSlug as CategorySlug });
          }
        }

        setFeedback({
          type: 'success',
          text: `Categoria "${catName}" e emoji ${cleanEmoji} atualizados com sucesso!`
        });
        cancelEdit();
      } else {
        // Check for duplicate slug
        if (categories.some(c => c.slug === cleanSlug)) {
          setFeedback({
            type: 'error',
            text: `Já existe uma categoria com o slug "${cleanSlug}". Escolha um slug diferente.`
          });
          return;
        }

        const newId = `cat-${cleanSlug}-${Date.now().toString().slice(-4)}`;
        await addCategory({
          id: newId,
          name: catName.trim(),
          slug: cleanSlug as CategorySlug,
          description: catDesc.trim(),
          emoji: cleanEmoji,
          iconName: 'Layers'
        });

        setFeedback({
          type: 'success',
          text: `Nova categoria "${catName}" (${cleanEmoji}) criada com sucesso!`
        });
        cancelEdit();
      }

      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      console.error('Category save error:', err);
      setFeedback({ type: 'error', text: 'Erro ao salvar categoria no banco de dados.' });
    }
  };

  const [catToDelete, setCatToDelete] = useState<CategoryInfo | null>(null);

  const handleDelete = (cat: CategoryInfo) => {
    setCatToDelete(cat);
  };

  const confirmDeleteCategory = async () => {
    if (!catToDelete) return;
    const cat = catToDelete;

    try {
      await deleteCategory(cat.id);
      if (editingCatId === cat.id) {
        cancelEdit();
      }
      setFeedback({
        type: 'success',
        text: `Categoria "${cat.name}" excluída com sucesso.`
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error('Delete category error:', err);
      setFeedback({ type: 'error', text: 'Erro ao excluir categoria.' });
    } finally {
      setCatToDelete(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="bg-white dark:bg-[#070F1E] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 text-xs font-bold font-['Outfit'] uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5" />
              Gestão de Categorias & Emojis
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0A192F] dark:text-white font-['Outfit']">
              Categorias do Blog
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
              Defina os emojis, nomes e descrições das categorias. As alterações são sincronizadas em tempo real no menu, nos filtros e na página inicial.
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-4 p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Categorias Existentes */}
        <div className="lg:col-span-7 bg-white dark:bg-[#070F1E] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] dark:border-slate-800">
            <h3 className="text-base sm:text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#1D4ED8] dark:text-blue-400" />
              <span>Categorias Existentes ({categories.length})</span>
            </h3>
            <span className="text-xs text-[#64748B] dark:text-slate-400 font-mono">
              Total: {posts.length} artigos
            </span>
          </div>

          <div className="space-y-3">
            {categories.map(cat => {
              const isSelected = editingCatId === cat.id;
              const postCount = posts.filter(p => p.category === cat.slug).length;

              return (
                <div
                  key={cat.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-[#1D4ED8] dark:border-blue-500 shadow-xs'
                      : 'bg-[#F8FAFC] dark:bg-slate-900/60 border-[#E2E8F0] dark:border-slate-800 hover:border-[#CBD5E1] dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Emoji + Texts */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shadow-xs shrink-0 select-none">
                        {cat.emoji || '✈️'}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-[#0A192F] dark:text-white font-['Outfit']">
                            {cat.name}
                          </h4>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1D4ED8] text-white">
                              Em Edição
                            </span>
                          )}
                        </div>

                        {cat.description && (
                          <p className="text-xs text-[#64748B] dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {cat.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          <span className="font-mono text-[#1D4ED8] dark:text-blue-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            slug: <strong>{cat.slug}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono text-[#475569] dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            <FileText className="w-3 h-3 text-[#1D4ED8] dark:text-blue-400" />
                            <span>{postCount} {postCount === 1 ? 'artigo' : 'artigos'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        className={`p-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#1D4ED8] text-white'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0A192F] dark:text-white hover:bg-[#EFF6FF] dark:hover:bg-slate-700'
                        }`}
                        title="Editar Categoria e Emoji"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors cursor-pointer"
                        title="Excluir Categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Form Adicionar / Editar */}
        <div className="lg:col-span-5 bg-white dark:bg-[#070F1E] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] dark:border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-2">
                {editingCatId ? (
                  <>
                    <Edit2 className="w-4 h-4 text-[#1D4ED8] dark:text-blue-400" />
                    <span>Editar Categoria</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-[#1D4ED8] dark:text-blue-400" />
                    <span>Adicionar Nova Categoria</span>
                  </>
                )}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                {editingCatId
                  ? 'Altere o emoji, nome e descrição da categoria selecionada.'
                  : 'Crie uma nova categoria com emoji personalizado para o blog.'}
              </p>
            </div>

            {editingCatId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                title="Cancelar Edição"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Emoji Selection Section */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider font-['Outfit']">
                Emoji da Categoria *
              </label>

              <div className="flex items-center gap-3">
                {/* Large Preview */}
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border-2 border-[#1D4ED8] dark:border-blue-500 flex items-center justify-center text-3xl shadow-sm select-none">
                  {catEmoji || '✈️'}
                </div>

                {/* Input text for custom typed/pasted emoji */}
                <div className="flex-1 space-y-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={catEmoji}
                      onChange={e => setCatEmoji(e.target.value)}
                      placeholder="Digite ou cole qualquer emoji..."
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-[#0A192F] dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D4ED8] font-mono"
                    />
                    <Smile className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                    Você pode colar qualquer emoji ou escolher um dos sugeridos abaixo.
                  </p>
                </div>
              </div>

              {/* Suggested Quick Picker Palette */}
              <div>
                <span className="block text-[11px] font-bold text-[#64748B] dark:text-slate-400 mb-1.5 uppercase font-mono">
                  Sugestões Rápidas:
                </span>
                <div className="grid grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  {SUGGESTED_EMOJIS.map((em, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCatEmoji(em)}
                      className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                        catEmoji === em
                          ? 'bg-blue-100 dark:bg-blue-900 border border-blue-500 scale-110'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      title={`Selecionar ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider mb-1 font-['Outfit']">
                Nome da Categoria *
              </label>
              <input
                type="text"
                required
                value={catName}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Ex: Engenharia Aeronáutica"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#CBD5E1] dark:border-slate-700 text-[#0A192F] dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>

            {/* Slug URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider font-['Outfit']">
                  Slug da URL *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAutoSlug(true);
                    setCatSlug(slugify(catName));
                  }}
                  className="text-[10px] text-[#1D4ED8] dark:text-blue-400 hover:underline font-mono"
                >
                  Auto-gerar
                </button>
              </div>
              <input
                type="text"
                required
                value={catSlug}
                onChange={e => {
                  setAutoSlug(false);
                  setCatSlug(e.target.value);
                }}
                placeholder="Ex: engenharia-aeronautica"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#CBD5E1] dark:border-slate-700 text-[#0A192F] dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D4ED8]"
              />
              <p className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1">
                Identificador URL (ex: <code>/categoria/{catSlug || 'exemplo'}</code>)
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider mb-1 font-['Outfit']">
                Descrição da Categoria
              </label>
              <textarea
                rows={3}
                value={catDesc}
                onChange={e => setCatDesc(e.target.value)}
                placeholder="Explicação exibida no banner superior da categoria..."
                className="w-full p-3 text-xs sm:text-sm bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#CBD5E1] dark:border-slate-700 text-[#0A192F] dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 py-3 bg-[#0A192F] hover:bg-[#1E3A8A] text-white text-xs font-bold uppercase rounded-xl transition-colors flex items-center justify-center gap-2 font-['Outfit'] cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>{editingCatId ? 'Salvar Alterações' : 'Cadastrar Categoria'}</span>
              </button>

              {editingCatId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#334155] dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão de Categoria */}
      {catToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#070F1E] rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E2E8F0] dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                  Confirmar Exclusão
                </h3>
                <span className="text-[10px] font-mono uppercase text-rose-600 font-bold">
                  Ação Irreversível
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#334155] dark:text-slate-300 leading-relaxed">
              Você tem certeza que deseja excluir a categoria <strong className="text-[#0A192F] dark:text-white font-bold">"{catToDelete.name}"</strong>?
              {posts.filter(p => p.category === catToDelete.slug).length > 0 && (
                <span className="block mt-2 text-rose-600 dark:text-rose-400 font-medium">
                  Atenção: Existem {posts.filter(p => p.category === catToDelete.slug).length} artigo(s) vinculados a esta categoria.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCatToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 text-[#64748B] dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Sim, Excluir Categoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
