// @flow
import React from 'react';

import * as ICONS from 'constants/icons';

import useCombinedRefs from 'effects/use-combined-refs';
import useHover from 'effects/use-hover';

import Button from 'component/button';
import Tooltip from 'component/common/tooltip';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <>
      <Tooltip title={__('Bold')} placement="top">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={ICONS.BOLD}
        />
      </Tooltip>

      <Tooltip title={__('Italic')} placement="top">
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={ICONS.ITALIC}
        />
      </Tooltip>

      <Tooltip title={__('Strike Through')} placement="top">
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          icon={ICONS.STRIKE_THROUGH}
        />
      </Tooltip>

      <Tooltip title={__('Code')} placement="top">
        <MenuButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          icon={ICONS.CODE}
        />
      </Tooltip>

      <Tooltip title={__('Heading %heading_size%', { heading_size: 1 })} placement="top">
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          icon={ICONS.HEADING_1}
        />
      </Tooltip>

      <Tooltip title={__('Heading %heading_size%', { heading_size: 2 })} placement="top">
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={ICONS.HEADING_2}
        />
      </Tooltip>

      <Tooltip title={__('Heading %heading_size%', { heading_size: 3 })} placement="top">
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          icon={ICONS.HEADING_3}
        />
      </Tooltip>

      <Tooltip title={__('Heading %heading_size%', { heading_size: 4 })} placement="top">
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          isActive={editor.isActive('heading', { level: 4 })}
          icon={ICONS.HEADING_4}
        />
      </Tooltip>

      <Tooltip title={__('Heading %heading_size%', { heading_size: 5 })} placement="top">
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
          isActive={editor.isActive('heading', { level: 5 })}
          icon={ICONS.HEADING_5}
        />
      </Tooltip>

      <Tooltip title={__('Heading %heading_size%', { heading_size: 6 })} placement="top">
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
          isActive={editor.isActive('heading', { level: 6 })}
          icon={ICONS.HEADING_6}
        />
      </Tooltip>

      <Tooltip title={__('Bullet List')} placement="top">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={ICONS.BULLET_LIST}
        />
      </Tooltip>

      <Tooltip title={__('Ordered List')} placement="top">
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={ICONS.ORDERED_LIST}
        />
      </Tooltip>

      <Tooltip title={__('Code Block')} placement="top">
        <MenuButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          icon={ICONS.CODE_BLOCK}
        />
      </Tooltip>

      <Tooltip title={__('Blockquote')} placement="top">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={ICONS.BLOCKQUOTE}
        />
      </Tooltip>

      <Tooltip title={__('Horizontal Rule')} placement="top">
        <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={ICONS.HORIZONTAL_RULE} />
      </Tooltip>

      <Tooltip title={__('Undo')} placement="top">
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          icon={ICONS.UNDO}
        />
      </Tooltip>

      <Tooltip title={__('Redo')} placement="top">
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          icon={ICONS.REDO}
        />
      </Tooltip>
    </>
  );
};

type MenuButtonProps = {
  isActive?: boolean,
  disabled?: boolean,
  icon: string,
  onClick: () => void,
};

const MenuButton = React.forwardRef((props: MenuButtonProps, ref) => {
  const { isActive, ...buttonProps } = props;

  const buttonRef = React.useRef();
  const combinedRef = useCombinedRefs(ref, buttonRef);
  const isHovering = useHover(buttonRef);

  return <Button {...buttonProps} ref={combinedRef} className={isActive || isHovering ? 'is-active' : undefined} />;
});

export default MenuBar;
