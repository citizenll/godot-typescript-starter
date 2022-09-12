import { dayjs } from './thirdpart';

export default class Main extends godot.Node2D {
  //check inspector to set
  icon: godot.Sprite;
  label: godot.Label

  _ready(): void {
    this.icon = this.$("Icon") as godot.Sprite
    this.label = this.$("Label") as godot.Label
  }

  _process(delta: number) {
    this.label.text = `${dayjs().format('{YYYY} MM-DDTHH:mm:ss SSS [Z] A')}`
    this.icon.rotation_degrees += 180 * delta;
  }
}
