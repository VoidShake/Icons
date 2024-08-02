import type Icon from '../types/Icon'

export default function IconPanel({ id, namespace, url }: Icon) {
   return (
      <li>
         <img src={url} alt={`${namespace}:${id}`} />
         <p>
            <small>{namespace}/</small>
         </p>
         <p>{id}</p>
      </li>
   )
}
