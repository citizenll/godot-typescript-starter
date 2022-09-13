import { node } from './decorators';
import { dayjs } from './thirdpart';

export default class Main extends godot.Node2D {
  //check inspector to set
  @node
  icon: godot.Sprite;
  @node
  label: godot.Label

  _process(delta: number) {
    this.label.text = `${dayjs().format('{YYYY} MM-DDTHH:mm:ss SSS [Z] A')}`
    this.icon.rotation_degrees += 180 * delta;
  }
}